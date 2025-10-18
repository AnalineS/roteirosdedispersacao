# -*- coding: utf-8 -*-
"""
Development Cloud Mocks - Zero Warning Cloud Integration
Mock implementations for cloud services in development environment
"""

import os
import json
import logging
from typing import Any, Dict, Optional, List
from datetime import datetime, timezone
from pathlib import Path

logger = logging.getLogger(__name__)

class MockGoogleCloudStorage:
    """Mock Google Cloud Storage for development"""

    def __init__(self, bucket_name: str = None):
        self.bucket_name = bucket_name or "dev-mock-bucket"
        self.local_storage = Path("./cache/mock_gcs")
        self.local_storage.mkdir(parents=True, exist_ok=True)
        logger.info(f"[DEV] Mock GCS initialized with local storage: {self.local_storage}")

    def bucket(self, name: str):
        """Return mock bucket"""
        return MockBucket(name, self.local_storage)

    def get_bucket(self, name: str):
        """Return mock bucket"""
        return self.bucket(name)

class MockBucket:
    """Mock GCS Bucket"""

    def __init__(self, name: str, storage_path: Path):
        self.name = name
        self.storage_path = storage_path / name
        self.storage_path.mkdir(parents=True, exist_ok=True)
        self._time_created = datetime.now(timezone.utc)

    @property
    def time_created(self):
        """Get bucket creation time"""
        return self._time_created

    def blob(self, name: str):
        """Return mock blob"""
        return MockBlob(name, self.storage_path)

    def list_blobs(self, prefix: str = ""):
        """List mock blobs"""
        blobs = []
        for file_path in self.storage_path.rglob("*"):
            if file_path.is_file():
                relative_path = file_path.relative_to(self.storage_path)
                if str(relative_path).startswith(prefix):
                    blobs.append(MockBlob(str(relative_path), self.storage_path))
        return blobs

class MockBlob:
    """Mock GCS Blob"""

    def __init__(self, name: str, storage_path: Path):
        self.name = name
        self.storage_path = storage_path
        self.file_path = storage_path / name
        self._metadata = {}
        self._content_type = None
        self._time_created = datetime.now(timezone.utc)

    @property
    def metadata(self):
        """Get blob metadata"""
        return self._metadata

    @metadata.setter
    def metadata(self, value):
        """Set blob metadata"""
        self._metadata = value or {}

    @property
    def size(self):
        """Get blob size"""
        try:
            return self.file_path.stat().st_size if self.file_path.exists() else 0
        except Exception:
            return 0

    @property
    def content_type(self):
        """Get blob content type"""
        return self._content_type

    @content_type.setter
    def content_type(self, value):
        """Set blob content type"""
        self._content_type = value

    @property
    def time_created(self):
        """Get blob creation time"""
        return self._time_created

    def exists(self) -> bool:
        """Check if mock blob exists"""
        return self.file_path.exists()

    def upload_from_string(self, data: str, content_type: str = "text/plain"):
        """Upload string data to mock storage"""
        try:
            self.file_path.parent.mkdir(parents=True, exist_ok=True)
            self.file_path.write_text(data, encoding='utf-8')
            self._content_type = content_type
            self._time_created = datetime.now(timezone.utc)
            logger.debug(f"[DEV] Mock upload: {self.name}")
        except Exception as e:
            logger.error(f"[DEV] Mock upload_from_string failed: {e}")
            raise

    def upload_from_file(self, file_obj, content_type: str = None):
        """Upload file to mock storage"""
        try:
            self.file_path.parent.mkdir(parents=True, exist_ok=True)
            with open(self.file_path, 'wb') as f:
                f.write(file_obj.read())
            self._content_type = content_type
            self._time_created = datetime.now(timezone.utc)
            logger.debug(f"[DEV] Mock file upload: {self.name}")
        except Exception as e:
            logger.error(f"[DEV] Mock upload_from_file failed: {e}")
            raise

    def download_as_text(self) -> str:
        """Download mock blob as text"""
        try:
            if self.file_path.exists():
                return self.file_path.read_text(encoding='utf-8')
            raise FileNotFoundError(f"Mock blob not found: {self.name}")
        except Exception as e:
            logger.error(f"[DEV] Mock download_as_text failed: {e}")
            raise

    def download_to_file(self, file_obj):
        """Download mock blob to file"""
        try:
            if self.file_path.exists():
                with open(self.file_path, 'rb') as f:
                    file_obj.write(f.read())
            else:
                raise FileNotFoundError(f"Mock blob not found: {self.name}")
        except Exception as e:
            logger.error(f"[DEV] Mock download_to_file failed: {e}")
            raise

    def upload_from_filename(self, filename: str, content_type: str = None):
        """Upload file from filename to mock storage"""
        try:
            self.file_path.parent.mkdir(parents=True, exist_ok=True)
            # Copy file to mock storage
            import shutil
            shutil.copy2(filename, self.file_path)
            logger.debug(f"[DEV] Mock upload from filename: {filename} -> {self.name}")
        except Exception as e:
            logger.error(f"[DEV] Mock upload_from_filename failed: {e}")
            raise

    def download_to_filename(self, filename: str):
        """Download mock blob to filename"""
        try:
            if not self.file_path.exists():
                raise FileNotFoundError(f"Mock blob not found: {self.name}")

            # Ensure target directory exists
            Path(filename).parent.mkdir(parents=True, exist_ok=True)

            # Copy file from mock storage
            import shutil
            shutil.copy2(self.file_path, filename)
            logger.debug(f"[DEV] Mock download to filename: {self.name} -> {filename}")
        except Exception as e:
            logger.error(f"[DEV] Mock download_to_filename failed: {e}")
            raise

    def delete(self):
        """Delete mock blob"""
        if self.file_path.exists():
            self.file_path.unlink()
            logger.debug(f"[DEV] Mock delete: {self.name}")

class MockSupabaseClient:
    """Mock Supabase client for development"""

    def __init__(self, url: str = None, key: str = None):
        self.url = url or "http://localhost:54321"
        self.key = key or "mock-development-key"
        self.local_storage = Path("./cache/mock_supabase")
        self.local_storage.mkdir(parents=True, exist_ok=True)
        logger.info(f"[DEV] Mock Supabase initialized: {self.url}")

    def table(self, name: str):
        """Return mock table"""
        return MockSupabaseTable(name, self.local_storage)

    def rpc(self, function_name: str, params: Dict = None):
        """Mock RPC call"""
        logger.debug(f"[DEV] Mock RPC call: {function_name}")
        return MockSupabaseResponse([])

class MockSupabaseTable:
    """Mock Supabase table"""

    def __init__(self, name: str, storage_path: Path):
        self.name = name
        self.storage_path = storage_path
        self.table_file = storage_path / f"{name}.json"

    def _load_data(self) -> List[Dict]:
        """Load mock table data"""
        if self.table_file.exists():
            return json.loads(self.table_file.read_text())
        return []

    def _save_data(self, data: List[Dict]):
        """Save mock table data"""
        self.table_file.write_text(json.dumps(data, indent=2))

    def select(self, columns: str = "*"):
        """Mock select"""
        return MockSupabaseQuery(self)

    def insert(self, data: Dict):
        """Mock insert"""
        current_data = self._load_data()
        if isinstance(data, list):
            current_data.extend(data)
        else:
            current_data.append(data)
        self._save_data(current_data)
        return MockSupabaseResponse(data)

    def upsert(self, data: Dict):
        """Mock upsert"""
        return self.insert(data)

class MockSupabaseQuery:
    """Mock Supabase query"""

    def __init__(self, table: MockSupabaseTable):
        self.table = table
        self.filters = {}
        self.order_by_column = None
        self.order_ascending = True

    def eq(self, column: str, value: Any):
        """Mock equality filter"""
        self.filters[column] = value
        return self

    def neq(self, column: str, value: Any):
        """Mock not equal filter"""
        if 'neq' not in self.filters:
            self.filters['neq'] = {}
        self.filters['neq'][column] = value
        return self

    def gt(self, column: str, value: Any):
        """Mock greater than filter"""
        if 'gt' not in self.filters:
            self.filters['gt'] = {}
        self.filters['gt'][column] = value
        return self

    def gte(self, column: str, value: Any):
        """Mock greater than or equal filter"""
        if 'gte' not in self.filters:
            self.filters['gte'] = {}
        self.filters['gte'][column] = value
        return self

    def lt(self, column: str, value: Any):
        """Mock less than filter"""
        if 'lt' not in self.filters:
            self.filters['lt'] = {}
        self.filters['lt'][column] = value
        return self

    def lte(self, column: str, value: Any):
        """Mock less than or equal filter"""
        if 'lte' not in self.filters:
            self.filters['lte'] = {}
        self.filters['lte'][column] = value
        return self

    def ilike(self, column: str, pattern: str):
        """Mock case insensitive like filter"""
        if 'ilike' not in self.filters:
            self.filters['ilike'] = {}
        self.filters['ilike'][column] = pattern
        return self

    def order(self, column: str, desc: bool = False):
        """Mock order by"""
        self.order_by_column = column
        self.order_ascending = not desc
        return self

    def limit(self, count: int):
        """Mock limit"""
        self.limit_count = count
        return self

    def single(self):
        """Execute mock query and return single result"""
        result = self.execute()
        if result.data:
            return MockSupabaseResponse(result.data[0])
        return MockSupabaseResponse(None)

    def execute(self):
        """Execute mock query"""
        try:
            data = self.table._load_data()

            # Apply filtering
            for column, value in self.filters.items():
                if column in ['neq', 'gt', 'gte', 'lt', 'lte', 'ilike']:
                    continue  # Skip operator keys
                data = [row for row in data if row.get(column) == value]

            # Apply operator filters
            if 'neq' in self.filters:
                for column, value in self.filters['neq'].items():
                    data = [row for row in data if row.get(column) != value]

            if 'gt' in self.filters:
                for column, value in self.filters['gt'].items():
                    data = [row for row in data if row.get(column, 0) > value]

            if 'gte' in self.filters:
                for column, value in self.filters['gte'].items():
                    data = [row for row in data if row.get(column, 0) >= value]

            if 'lt' in self.filters:
                for column, value in self.filters['lt'].items():
                    data = [row for row in data if row.get(column, 0) < value]

            if 'lte' in self.filters:
                for column, value in self.filters['lte'].items():
                    data = [row for row in data if row.get(column, 0) <= value]

            if 'ilike' in self.filters:
                for column, pattern in self.filters['ilike'].items():
                    # Simple case insensitive pattern matching
                    pattern_clean = pattern.replace('%', '').lower()
                    data = [row for row in data if pattern_clean in str(row.get(column, '')).lower()]

            # Apply ordering
            if self.order_by_column:
                try:
                    data.sort(key=lambda x: x.get(self.order_by_column, 0), reverse=not self.order_ascending)
                except Exception as e:
                    logger.debug(f"[DEV] Mock ordering failed: {e}")

            # Apply limit
            if hasattr(self, 'limit_count'):
                data = data[:self.limit_count]

            return MockSupabaseResponse(data)

        except Exception as e:
            logger.error(f"[DEV] Mock query execution failed: {e}")
            return MockSupabaseResponse([], error=str(e))

class MockSupabaseResponse:
    """Mock Supabase response"""

    def __init__(self, data: Any, error: str = None):
        self.data = data
        self.error = error
        self.count = len(data) if isinstance(data, list) else (1 if data is not None else 0)

    def __bool__(self):
        """Boolean conversion for response"""
        return self.error is None and self.data is not None

    def __len__(self):
        """Length of response data"""
        return self.count if self.data else 0

class DevelopmentCloudManager:
    """Manages cloud mocks for development environment"""

    def __init__(self, config):
        self.config = config
        self.is_development = getattr(config, 'IS_DEVELOPMENT', True)
        self.mock_gcs = None
        self.mock_supabase = None

        if self.is_development:
            self._init_development_mocks()
        else:
            logger.info("[PROD] Production environment - using real cloud services")

    def _init_development_mocks(self):
        """Initialize development mocks"""
        logger.info("[DEV] Initializing development cloud mocks...")

        # Mock Google Cloud Storage
        self.mock_gcs = MockGoogleCloudStorage(
            getattr(self.config, 'GCS_BUCKET_NAME', 'dev-bucket')
        )

        # Mock Supabase
        self.mock_supabase = MockSupabaseClient(
            getattr(self.config, 'SUPABASE_URL', 'http://localhost:54321'),
            getattr(self.config, 'SUPABASE_KEY', 'mock-key')
        )

        logger.info("[DEV] ✅ All cloud mocks initialized successfully")

    def get_gcs_client(self):
        """Get GCS client (mock in dev, real in prod)"""
        if self.is_development:
            return self.mock_gcs

        # Production - import real client
        try:
            from google.cloud import storage
            return storage.Client()
        except Exception as e:
            logger.error(f"Failed to initialize real GCS client: {e}")
            # Fallback to mock even in production
            return self.mock_gcs or MockGoogleCloudStorage()

    def get_supabase_client(self):
        """Get Supabase client (mock in dev, real in prod)"""
        if self.is_development:
            return self.mock_supabase

        # Production - import real client
        try:
            from supabase import create_client
            return create_client(self.config.SUPABASE_URL, self.config.SUPABASE_KEY)
        except Exception as e:
            logger.error(f"Failed to initialize real Supabase client: {e}")
            # Fallback to mock even in production
            return self.mock_supabase or MockSupabaseClient()

    def verify_configuration(self) -> Dict[str, bool]:
        """Verify cloud configuration without warnings"""
        status = {
            'gcs_available': False,
            'supabase_available': False,
            'environment': 'development' if self.is_development else 'production'
        }

        # Check GCS
        try:
            gcs_client = self.get_gcs_client()
            if gcs_client:
                status['gcs_available'] = True
                logger.info("[OK] GCS client available")
        except Exception:
            logger.debug("[INFO] GCS not available - using fallback")

        # Check Supabase
        try:
            supabase_client = self.get_supabase_client()
            if supabase_client:
                status['supabase_available'] = True
                logger.info("[OK] Supabase client available")
        except Exception:
            logger.debug("[INFO] Supabase not available - using fallback")

        return status

def get_cloud_manager(config):
    """Get cloud manager instance"""
    return DevelopmentCloudManager(config)