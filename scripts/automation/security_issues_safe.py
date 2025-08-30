#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Safe Security Issues Automation Script
Creates consolidated issues without overwhelming GitHub API
"""

import os
import time
import json
import requests
from typing import Dict, List, Optional
from dataclasses import dataclass
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@dataclass
class SecurityAlert:
    category_key: str
    category_title: str
    severity: str
    rule_id: str
    rule_name: str
    tool_name: str
    file_path: str
    line: Optional[int]
    alert_id: str
    alert_url: str
    description: str
    cwe_refs: List[str]

class SafeGitHubSecurityManager:
    """Safe GitHub security issue manager with rate limiting and consolidation"""
    
    def __init__(self, owner: str, repo: str, max_issues_per_run: int = 10):
        self.owner = owner
        self.repo = repo
        self.max_issues_per_run = max_issues_per_run
        self.token = os.environ.get('GITHUB_TOKEN')
        if not self.token:
            raise ValueError("GITHUB_TOKEN environment variable is required")
        
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'token {self.token}',
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28'
        })
        
        # Much more conservative rate limiting
        self.request_delay = 2  # 2 seconds between requests
        self.batch_delay = 10   # 10 seconds between batches
        
        self.severity_labels = {
            'high': 'priority/high',
            'critical': 'priority/critical',
            'medium': 'priority/medium',
            'low': 'priority/low'
        }
        
        self.base_labels = ['security', 'code-scanning']
        self.default_assignee = 'AnalineS'
        
    def _safe_request(self, method: str, url: str, **kwargs) -> requests.Response:
        """Make request with conservative rate limiting"""
        logger.info(f"Making {method} request to {url}")
        time.sleep(self.request_delay)  # Always wait between requests
        
        max_retries = 3
        for attempt in range(max_retries):
            try:
                response = self.session.request(method, url, **kwargs)
                
                if response.status_code == 403:
                    logger.warning("Rate limit or permission issue, waiting longer...")
                    time.sleep(60)  # Wait 1 minute
                    if attempt < max_retries - 1:
                        continue
                
                response.raise_for_status()
                return response
                
            except requests.exceptions.RequestException as e:
                if attempt < max_retries - 1:
                    wait_time = 30 * (attempt + 1)
                    logger.warning(f"Request failed, waiting {wait_time}s: {e}")
                    time.sleep(wait_time)
                else:
                    raise
        
        return response
    
    def fetch_alerts_summary(self) -> Dict[str, List[SecurityAlert]]:
        """Fetch and group alerts by category"""
        logger.info("Fetching security alerts...")
        
        alerts = []
        page = 1
        
        # Limit to first few pages to avoid overwhelming
        max_pages = 3
        
        while page <= max_pages:
            url = f"https://api.github.com/repos/{self.owner}/{self.repo}/code-scanning/alerts"
            params = {'page': page, 'per_page': 50, 'state': 'open'}
            
            try:
                response = self._safe_request('GET', url, params=params)
                page_alerts = response.json()
                
                if not page_alerts:
                    break
                
                for alert_data in page_alerts:
                    try:
                        alert = self._normalize_alert(alert_data)
                        if alert:
                            alerts.append(alert)
                    except Exception as e:
                        logger.error(f"Error processing alert: {e}")
                        continue
                
                logger.info(f"Processed page {page}, found {len(page_alerts)} alerts")
                page += 1
                
            except Exception as e:
                logger.error(f"Error fetching page {page}: {e}")
                break
        
        # Group by category
        categories = {}
        for alert in alerts:
            if alert.category_key not in categories:
                categories[alert.category_key] = []
            categories[alert.category_key].append(alert)
        
        logger.info(f"Found {len(alerts)} alerts in {len(categories)} categories")
        return categories
    
    def _normalize_alert(self, alert_data: dict) -> Optional[SecurityAlert]:
        """Normalize alert data"""
        try:
            rule = alert_data.get('rule', {})
            rule_id = rule.get('id', 'unknown')
            rule_name = rule.get('name', rule_id)
            
            category_key = rule_id.lower().replace('/', '-').replace('_', '-')
            category_title = self._generate_category_title(rule_name, rule_id)
            
            most_recent = alert_data.get('most_recent_instance', {})
            location = most_recent.get('location', {})
            
            cwe_refs = []
            if rule.get('tags'):
                cwe_refs = [tag for tag in rule['tags'] if tag.startswith('external/cwe/cwe-')]
            
            return SecurityAlert(
                category_key=category_key,
                category_title=category_title,
                severity=rule.get('severity', 'medium').lower(),
                rule_id=rule_id,
                rule_name=rule_name,
                tool_name=alert_data.get('tool', {}).get('name', 'CodeQL'),
                file_path=most_recent.get('ref', 'unknown'),
                line=location.get('start_line') if location else None,
                alert_id=str(alert_data.get('number', '')),
                alert_url=alert_data.get('html_url', ''),
                description=rule.get('description', ''),
                cwe_refs=cwe_refs
            )
            
        except Exception as e:
            logger.error(f"Error normalizing alert: {e}")
            return None
    
    def _generate_category_title(self, rule_name: str, rule_id: str) -> str:
        """Generate readable category title"""
        if rule_name and rule_name != rule_id:
            return rule_name
        
        title = rule_id.replace('/', ' - ').replace('_', ' ').replace('-', ' ')
        return ' '.join(word.capitalize() for word in title.split())
    
    def create_consolidated_epic(self, category_key: str, category_title: str, 
                               alerts: List[SecurityAlert]) -> Optional[int]:
        """Create consolidated epic with all occurrences in body"""
        
        # Check if epic exists
        epic_title = f"{category_title} [SECURITY EPIC]"
        
        # Count by severity
        severity_counts = {}
        for alert in alerts:
            sev = alert.severity.upper()
            severity_counts[sev] = severity_counts.get(sev, 0) + 1
        
        # Get unique files affected
        files_affected = set(alert.file_path for alert in alerts)
        
        # Sample CWE and rule info
        sample_alert = alerts[0]
        
        epic_body = f"""# {category_title} - Consolidated Security Issue

## [REPORT] **Overview**
- **Total Occurrences:** {len(alerts)}
- **Severity Distribution:** {', '.join(f'{sev}: {count}' for sev, count in severity_counts.items())}
- **Files Affected:** {len(files_affected)} files
- **Rule:** {sample_alert.rule_name} ({sample_alert.rule_id})
- **Tool:** {sample_alert.tool_name}

## 🏷️ **References**
"""
        
        if sample_alert.cwe_refs:
            epic_body += f"- **CWE:** {', '.join(sample_alert.cwe_refs)}\n"
        
        epic_body += f"""
## [NOTE] **Description**
{sample_alert.description}

## [SECURITY] **Mitigation Strategy**
1. **Identify all instances** of this security pattern
2. **Prioritize by severity** - address Critical/High first  
3. **Apply consistent fixes** across all occurrences
4. **Add security tests** to prevent regression
5. **Validate with CodeQL** after fixes

## 📍 **Affected Locations**

### Files Summary ({len(files_affected)} files):
"""
        
        # Group by file for better organization
        files_grouped = {}
        for alert in alerts:
            if alert.file_path not in files_grouped:
                files_grouped[alert.file_path] = []
            files_grouped[alert.file_path].append(alert)
        
        for file_path, file_alerts in files_grouped.items():
            lines = [str(alert.line) if alert.line else "?" for alert in file_alerts]
            epic_body += f"- **{file_path}** ({len(file_alerts)} occurrences) - Lines: {', '.join(lines)}\n"
        
        epic_body += f"""
## [OK] **Action Plan Checklist**

### Phase 1: Analysis & Planning
- [ ] **Triage all {len(alerts)} occurrences**
- [ ] **Create fix strategy document**  
- [ ] **Estimate effort and timeline**

### Phase 2: Implementation  
- [ ] **Fix critical/high severity issues first**
- [ ] **Apply consistent patterns across files**
- [ ] **Add security unit tests**

### Phase 3: Validation
- [ ] **Code review all changes**
- [ ] **Run security scans** (CodeQL, Snyk)
- [ ] **Verify all alerts resolved**
- [ ] **Update security documentation**

## 🔗 **Alert References**
"""
        
        # Add first 10 alert URLs to avoid overwhelming
        for i, alert in enumerate(alerts[:10]):
            line_part = f":{alert.line}" if alert.line else ""
            epic_body += f"- [{alert.file_path}{line_part}]({alert.alert_url}) (Alert #{alert.alert_id})\n"
        
        if len(alerts) > 10:
            epic_body += f"\n_... and {len(alerts) - 10} more occurrences (see CodeQL alerts page)_\n"
        
        epic_body += f"""
---
**[WARNING] Security Impact:** This issue affects {len(files_affected)} files with {len(alerts)} total occurrences.  
**📅 Created:** {time.strftime('%Y-%m-%d')}  
**[TARGET] Goal:** Eliminate all instances of this security vulnerability pattern.
"""
        
        # Determine epic severity label based on highest severity
        epic_labels = self.base_labels + ['epic', 'security-epic']
        max_severity = 'low'
        for alert in alerts:
            if alert.severity == 'critical':
                max_severity = 'critical'
                break
            elif alert.severity == 'high' and max_severity != 'critical':
                max_severity = 'high'
            elif alert.severity == 'medium' and max_severity not in ['critical', 'high']:
                max_severity = 'medium'
        
        severity_label = self.severity_labels.get(max_severity)
        if severity_label:
            epic_labels.append(severity_label)
        
        issue_data = {
            'title': epic_title,
            'body': epic_body,
            'labels': epic_labels,
            'assignees': [self.default_assignee]
        }
        
        try:
            url = f"https://api.github.com/repos/{self.owner}/{self.repo}/issues"
            response = self._safe_request('POST', url, json=issue_data)
            
            issue_number = response.json()['number']
            issue_url = response.json()['html_url']
            
            logger.info(f"[OK] Created consolidated epic #{issue_number}: {epic_title}")
            logger.info(f"[REPORT] Epic covers {len(alerts)} alerts in {len(files_affected)} files")
            logger.info(f"🔗 URL: {issue_url}")
            
            return issue_number
            
        except Exception as e:
            logger.error(f"[ERROR] Error creating epic for {category_title}: {e}")
            return None
    
    def process_top_categories(self, limit: int = 5) -> Dict:
        """Process only the top N categories by occurrence count"""
        logger.info("[SEARCH] Fetching security alerts summary...")
        
        categories = self.fetch_alerts_summary()
        if not categories:
            logger.warning("No security categories found")
            return {'epics': [], 'errors': [], 'summary': {}}
        
        # Sort categories by count (descending) and severity
        def category_priority(item):
            category_key, alerts = item
            # Count critical/high severity alerts
            high_priority_count = sum(1 for alert in alerts if alert.severity in ['critical', 'high'])
            return (high_priority_count, len(alerts))
        
        sorted_categories = sorted(categories.items(), key=category_priority, reverse=True)
        
        logger.info(f"[REPORT] Top categories by priority:")
        for i, (category_key, alerts) in enumerate(sorted_categories[:limit]):
            high_count = sum(1 for alert in alerts if alert.severity in ['critical', 'high'])
            logger.info(f"  {i+1}. {alerts[0].category_title}: {len(alerts)} total ({high_count} high/critical)")
        
        results = {
            'epics': [],
            'errors': [],
            'summary': {
                'total_categories': len(categories),
                'total_alerts': sum(len(alerts) for alerts in categories.values()),
                'processed_categories': 0,
                'skipped_categories': len(categories)
            }
        }
        
        # Process only top N categories
        for i, (category_key, alerts) in enumerate(sorted_categories[:limit]):
            if i >= self.max_issues_per_run:
                logger.info(f"⏭️ Reached maximum issues per run ({self.max_issues_per_run})")
                break
            
            try:
                logger.info(f"🔄 Processing category {i+1}/{limit}: {alerts[0].category_title}")
                
                epic_number = self.create_consolidated_epic(
                    category_key, 
                    alerts[0].category_title, 
                    alerts
                )
                
                if epic_number:
                    results['epics'].append({
                        'number': epic_number,
                        'category': alerts[0].category_title,
                        'alert_count': len(alerts),
                        'files_affected': len(set(alert.file_path for alert in alerts)),
                        'url': f"https://github.com/{self.owner}/{self.repo}/issues/{epic_number}"
                    })
                    
                    results['summary']['processed_categories'] += 1
                
                # Batch delay between categories
                if i < limit - 1:
                    logger.info(f"⏱️ Waiting {self.batch_delay}s before next category...")
                    time.sleep(self.batch_delay)
                
            except Exception as e:
                error_msg = f"Error processing {category_key}: {e}"
                logger.error(f"[ERROR] {error_msg}")
                results['errors'].append(error_msg)
        
        results['summary']['skipped_categories'] = len(categories) - results['summary']['processed_categories']
        
        return results

def main():
    """Main execution with safe limits"""
    try:
        # Safe limits
        MAX_EPICS_PER_RUN = 5  # Only process top 5 categories
        
        logger.info("[START] Starting SAFE Security Issues Automation")
        logger.info(f"[WARNING] Processing only top {MAX_EPICS_PER_RUN} categories to avoid API limits")
        
        manager = SafeGitHubSecurityManager(
            "AnalineS", 
            "roteirosdedispersacao",
            max_issues_per_run=MAX_EPICS_PER_RUN
        )
        
        results = manager.process_top_categories(limit=MAX_EPICS_PER_RUN)
        
        # Print comprehensive report
        print("\n" + "="*70)
        print("[SECURITY] SAFE SECURITY AUTOMATION REPORT")
        print("="*70)
        
        summary = results['summary']
        print(f"\n[REPORT] **Summary:**")
        print(f"  Total Categories Found: {summary['total_categories']}")
        print(f"  Total Alerts Found: {summary['total_alerts']}")  
        print(f"  Categories Processed: {summary['processed_categories']}")
        print(f"  Categories Remaining: {summary['skipped_categories']}")
        
        if results['epics']:
            print(f"\n[TARGET] **Consolidated Epics Created:**")
            total_alerts_processed = 0
            total_files_affected = 0
            
            for epic in results['epics']:
                print(f"\n  #{epic['number']}: {epic['category']}")
                print(f"    [REPORT] {epic['alert_count']} alerts in {epic['files_affected']} files")
                print(f"    🔗 {epic['url']}")
                
                total_alerts_processed += epic['alert_count']
                total_files_affected += epic['files_affected']
            
            print(f"\n📈 **Totals Consolidated:**")
            print(f"  Alerts Consolidated: {total_alerts_processed}")
            print(f"  Files Requiring Attention: {total_files_affected}")
        
        if results['errors']:
            print(f"\n[ERROR] **Errors ({len(results['errors'])}):**")
            for error in results['errors']:
                print(f"  - {error}")
        
        remaining = summary['total_alerts'] - sum(epic['alert_count'] for epic in results['epics'])
        if remaining > 0:
            print(f"\n⏭️ **Next Steps:**")
            print(f"  Run script again to process remaining {summary['skipped_categories']} categories")
            print(f"  {remaining} alerts still need consolidation")
            print(f"  Recommendation: Process in batches to avoid API limits")
        
        print(f"\n[OK] **Process completed safely!**")
        print(f"💡 **Approach:** Consolidated multiple alerts into single trackable epics")
        print(f"[SECURITY] **API Safety:** Used conservative rate limiting to avoid account restrictions")
        print("="*70)
        
        return 0
        
    except Exception as e:
        logger.error(f"💥 Fatal error: {e}")
        print(f"\n[ERROR] Script execution failed: {e}")
        return 1

if __name__ == "__main__":
    exit(main())