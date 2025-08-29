import { useBuckets } from './useBuckets';
import { useObjects } from './useObjects';
import { useS3Delete } from './useS3Delete';
import { useS3Rename } from './useS3Rename';
import { useS3Folders } from './useS3Folders';
import { useS3Metadata } from './useS3Metadata';

export const useS3Operations = () => {
  const buckets = useBuckets();
  const objects = useObjects();
  const s3Delete = useS3Delete(objects.selectedBucketRef);
  const s3Rename = useS3Rename(objects.selectedBucketRef);
  const s3Folders = useS3Folders(objects.selectedBucketRef);
  const s3Metadata = useS3Metadata(objects.selectedBucketRef);

  return {
    // Buckets
    ...buckets,
    
    // Objects
    ...objects,
    
    // Delete
    ...s3Delete,
    
    // Rename
    ...s3Rename,
    
    // Folders
    ...s3Folders,
    
    // Metadata
    ...s3Metadata
  };
};