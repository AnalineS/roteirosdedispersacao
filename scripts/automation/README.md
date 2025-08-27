# Security Automation Scripts

This directory contains scripts for automated security management.

## Available Scripts:

### check-vulnerabilities.py
Automated vulnerability scanning and reporting script.

### security_issues_safe.py  
Safe GitHub security issues automation script that creates consolidated epic issues from CodeQL alerts without overwhelming the API.

## Usage:
```bash
# Set GitHub token (or use GH_TOKEN secret)
export GITHUB_TOKEN=your_token

# Run security automation
python security_issues_safe.py
```

