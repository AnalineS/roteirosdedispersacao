# -*- coding: utf-8 -*-
"""
Real Google Cloud Storage Client - NO MOCKS
100% Real cloud integration with Google Cloud Storage
"""

import os
import json
import logging
from typing import Dict, Any, Optional, List, Union
from datetime import datetime, timedelta
from pathlib import Path
from google.cloud import storage
from google.oauth2 import service_account
from google.auth import default

logger = logging.getLogger(__name__)

class RealGCSClient:
    """Real Google Cloud Storage client - NO MOCKS"""

    def __init__(self, bucket_name: str, credentials_path: str = None, credentials_json: str = None):
        """Initialize real GCS client"""
        self.bucket_name = bucket_name
        self.client: storage.Client = None
        self.bucket: Bucket = None

        # Initialize authentication
        self._initialize_auth(credentials_path, credentials_json)

        # Initialize client and bucket
        self._initialize_client()

        # Validate connection
        self._validate_connection()

    def _initialize_auth(self, credentials_path: str = None, credentials_json: str = None):
        """Initialize real Google Cloud authentication"""
        try:
            if credentials_json:
                # Use service account JSON from environment variable
                credentials_dict = json.loads(credentials_json)
                credentials = service_account.Credentials.from_service_account_info(credentials_dict)
                self.client = storage.Client(credentials=credentials)
                logger.info("✅ Real GCS authenticated with service account JSON")

            elif credentials_path and Path(credentials_path).exists():
                # Use service account file
                credentials = service_account.Credentials.from_service_account_file(credentials_path)
                self.client = storage.Client(credentials=credentials)
                logger.info(f"✅ Real GCS authenticated with service account file: {credentials_path}")

            else:
                # Try application default credentials (for Cloud Run)
                credentials, project = default()
                self.client = storage.Client(credentials=credentials, project=project)
                logger.info("✅ Real GCS authenticated with application default credentials")

        except Exception as e:
            logger.error(f"❌ Failed to authenticate with GCS: {e}")
            raise

    def _initialize_client(self):
        """Initialize GCS client and bucket"""
        try:
            if not self.client:
                raise RuntimeError("GCS client not initialized")

            # Get bucket reference
            self.bucket = self.client.bucket(self.bucket_name)

            logger.info(f"✅ Real GCS client initialized for bucket: {self.bucket_name}")

        except Exception as e:
            logger.error(f"❌ Failed to initialize GCS client: {e}")
            raise

    def _validate_connection(self):
        """Validate real GCS connection"""
        try:
            # Test bucket access
            exists = self.bucket.exists()
            if not exists:
                logger.warning(f"Bucket {self.bucket_name} does not exist, attempting to create...")
                self.bucket.create()
                logger.info(f"✅ Created new GCS bucket: {self.bucket_name}")
            else:
                logger.info(f"✅ Real GCS bucket access validated: {self.bucket_name}")

            # Test write permissions with a small test file
            test_blob = self.bucket.blob('_health_check.txt')
            test_content = f"Health check: {datetime.now().isoformat()}"
            test_blob.upload_from_string(test_content)

            # Test read permissions
            downloaded_content = test_blob.download_as_text()
            if downloaded_content == test_content:
                logger.info("✅ Real GCS read/write permissions validated")
            else:
                raise RuntimeError("GCS read/write validation failed")

            # Clean up test file
            test_blob.delete()

        except Exception as e:
            logger.error(f"❌ Failed to validate GCS connection: {e}")
            raise

    def upload_file(self, file_path: Union[str, Path], destination_path: str, content_type: str = None) -> str:
        """Upload file to real GCS"""
        try:
            blob = self.bucket.blob(destination_path)

            # Determine content type if not provided
            if not content_type:
                if destination_path.endswith('.json'):
                    content_type = 'application/json'
                elif destination_path.endswith('.txt'):
                    content_type = 'text/plain'
                elif destination_path.endswith('.pdf'):
                    content_type = 'application/pdf'
                elif destination_path.endswith('.png'):
                    content_type = 'image/png'
                elif destination_path.endswith('.jpg') or destination_path.endswith('.jpeg'):
                    content_type = 'image/jpeg'
                else:
                    content_type = 'application/octet-stream'

            blob.upload_from_filename(str(file_path), content_type=content_type)

            # Get public URL
            public_url = f"gs://{self.bucket_name}/{destination_path}"

            logger.info(f"✅ File uploaded to GCS: {destination_path}")
            return public_url

        except Exception as e:
            logger.error(f"❌ Failed to upload file to GCS: {e}")
            raise

    def upload_string(self, content: str, destination_path: str, content_type: str = 'text/plain') -> str:
        """Upload string content to real GCS"""
        try:
            blob = self.bucket.blob(destination_path)
            blob.upload_from_string(content, content_type=content_type)

            public_url = f"gs://{self.bucket_name}/{destination_path}"

            logger.info(f"✅ String content uploaded to GCS: {destination_path}")
            return public_url

        except Exception as e:
            logger.error(f"❌ Failed to upload string to GCS: {e}")
            raise

    def upload_json(self, data: Dict[str, Any], destination_path: str) -> str:
        """Upload JSON data to real GCS"""
        try:
            json_content = json.dumps(data, indent=2, ensure_ascii=False)
            return self.upload_string(json_content, destination_path, 'application/json')

        except Exception as e:
            logger.error(f"❌ Failed to upload JSON to GCS: {e}")
            raise

    def download_file(self, source_path: str, destination_path: Union[str, Path]) -> bool:
        """Download file from real GCS"""
        try:
            blob = self.bucket.blob(source_path)

            if not blob.exists():
                logger.error(f"File does not exist in GCS: {source_path}")
                return False

            blob.download_to_filename(str(destination_path))

            logger.info(f"✅ File downloaded from GCS: {source_path} -> {destination_path}")
            return True

        except Exception as e:
            logger.error(f"❌ Failed to download file from GCS: {e}")
            return False

    def download_string(self, source_path: str) -> Optional[str]:
        """Download string content from real GCS"""
        try:
            blob = self.bucket.blob(source_path)

            if not blob.exists():
                logger.error(f"File does not exist in GCS: {source_path}")
                return None

            content = blob.download_as_text()

            logger.info(f"✅ String content downloaded from GCS: {source_path}")
            return content

        except Exception as e:
            logger.error(f"❌ Failed to download string from GCS: {e}")
            return None

    def download_json(self, source_path: str) -> Optional[Dict[str, Any]]:
        """Download JSON data from real GCS"""
        try:
            content = self.download_string(source_path)
            if content:
                return json.loads(content)
            return None

        except Exception as e:
            logger.error(f"❌ Failed to download JSON from GCS: {e}")
            return None

    def file_exists(self, file_path: str) -> bool:
        """Check if file exists in real GCS"""
        try:
            blob = self.bucket.blob(file_path)
            exists = blob.exists()

            logger.debug(f"File existence check: {file_path} = {exists}")
            return exists

        except Exception as e:
            logger.error(f"❌ Failed to check file existence in GCS: {e}")
            return False

    def delete_file(self, file_path: str) -> bool:
        """Delete file from real GCS"""
        try:
            blob = self.bucket.blob(file_path)

            if blob.exists():
                blob.delete()
                logger.info(f"✅ File deleted from GCS: {file_path}")
                return True
            else:
                logger.warning(f"File does not exist in GCS: {file_path}")
                return False

        except Exception as e:
            logger.error(f"❌ Failed to delete file from GCS: {e}")
            return False

    def list_files(self, prefix: str = "", limit: int = 1000) -> List[Dict[str, Any]]:
        """List files in real GCS bucket"""
        try:
            blobs = self.bucket.list_blobs(prefix=prefix, max_results=limit)

            files = []
            for blob in blobs:
                files.append({
                    'name': blob.name,
                    'size': blob.size,
                    'content_type': blob.content_type,
                    'created': blob.time_created.isoformat() if blob.time_created else None,
                    'updated': blob.updated.isoformat() if blob.updated else None,
                    'etag': blob.etag,
                    'public_url': f"gs://{self.bucket_name}/{blob.name}"
                })

            logger.info(f"✅ Listed {len(files)} files from GCS with prefix: {prefix}")
            return files

        except Exception as e:
            logger.error(f"❌ Failed to list files from GCS: {e}")
            return []

    def get_file_info(self, file_path: str) -> Optional[Dict[str, Any]]:
        """Get detailed file information from real GCS"""
        try:
            blob = self.bucket.blob(file_path)

            if not blob.exists():
                return None

            # Reload to get latest metadata
            blob.reload()

            info = {
                'name': blob.name,
                'size': blob.size,
                'content_type': blob.content_type,
                'created': blob.time_created.isoformat() if blob.time_created else None,
                'updated': blob.updated.isoformat() if blob.updated else None,
                'etag': blob.etag,
                'md5_hash': blob.md5_hash,
                'crc32c': blob.crc32c,
                'public_url': f"gs://{self.bucket_name}/{blob.name}",
                'metadata': blob.metadata or {}
            }

            logger.info(f"✅ Retrieved file info from GCS: {file_path}")
            return info

        except Exception as e:
            logger.error(f"❌ Failed to get file info from GCS: {e}")
            return None

    def create_signed_url(self, file_path: str, expiration_hours: int = 1, method: str = 'GET') -> Optional[str]:
        """Create signed URL for real GCS file"""
        try:
            blob = self.bucket.blob(file_path)

            if not blob.exists():
                logger.error(f"File does not exist in GCS: {file_path}")
                return None

            # Generate signed URL
            url = blob.generate_signed_url(
                version="v4",
                expiration=datetime.now() + timedelta(hours=expiration_hours),
                method=method
            )

            logger.info(f"✅ Generated signed URL for GCS file: {file_path}")
            return url

        except Exception as e:
            logger.error(f"❌ Failed to create signed URL for GCS: {e}")
            return None

    def copy_file(self, source_path: str, destination_path: str) -> bool:
        """Copy file within real GCS bucket"""
        try:
            source_blob = self.bucket.blob(source_path)

            if not source_blob.exists():
                logger.error(f"Source file does not exist in GCS: {source_path}")
                return False

            # Copy blob
            destination_blob = self.bucket.copy_blob(source_blob, self.bucket, destination_path)

            logger.info(f"✅ File copied in GCS: {source_path} -> {destination_path}")
            return True

        except Exception as e:
            logger.error(f"❌ Failed to copy file in GCS: {e}")
            return False

    def get_bucket_info(self) -> Dict[str, Any]:
        """Get real GCS bucket information"""
        try:
            # Reload bucket to get latest info
            self.bucket.reload()

            info = {
                'name': self.bucket.name,
                'location': self.bucket.location,
                'storage_class': self.bucket.storage_class,
                'created': self.bucket.time_created.isoformat() if self.bucket.time_created else None,
                'updated': self.bucket.updated.isoformat() if self.bucket.updated else None,
                'project': self.bucket.project,
                'lifecycle_rules': len(self.bucket.lifecycle_rules),
                'labels': self.bucket.labels or {}
            }

            logger.info(f"✅ Retrieved bucket info for: {self.bucket_name}")
            return info

        except Exception as e:
            logger.error(f"❌ Failed to get bucket info: {e}")
            return {'error': str(e)}

    def health_check(self) -> Dict[str, Any]:
        """Real GCS health check"""
        try:
            # Test bucket access
            bucket_exists = self.bucket.exists()

            # Test write permissions
            test_blob_name = f"_health_check_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
            test_content = f"Health check: {datetime.now().isoformat()}"

            try:
                test_blob = self.bucket.blob(test_blob_name)
                test_blob.upload_from_string(test_content)

                # Test read permissions
                downloaded = test_blob.download_as_text()
                read_success = downloaded == test_content

                # Clean up
                test_blob.delete()

                write_success = True
            except Exception as e:
                write_success = False
                read_success = False

            health_status = {
                'timestamp': datetime.now().isoformat(),
                'bucket_exists': bucket_exists,
                'write_access': write_success,
                'read_access': read_success,
                'bucket_name': self.bucket_name,
                'overall_healthy': bucket_exists and write_success and read_success
            }

            if health_status['overall_healthy']:
                logger.info("✅ Real GCS health check passed")
            else:
                logger.error("❌ Real GCS health check failed")

            return health_status

        except Exception as e:
            logger.error(f"❌ GCS health check failed: {e}")
            return {
                'timestamp': datetime.now().isoformat(),
                'overall_healthy': False,
                'error': str(e)
            }

def create_real_gcs_client(config) -> RealGCSClient:
    """Create real GCS client with configuration"""
    bucket_name = os.getenv('GCS_BUCKET_NAME') or getattr(config, 'GCS_BUCKET_NAME', None)
    credentials_json = os.getenv('GOOGLE_APPLICATION_CREDENTIALS_JSON')
    credentials_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')

    if not bucket_name:
        raise ValueError("GCS_BUCKET_NAME is required for real GCS integration")

    logger.info("🚀 Creating REAL Google Cloud Storage client (NO MOCKS)")
    return RealGCSClient(bucket_name, credentials_path, credentials_json)