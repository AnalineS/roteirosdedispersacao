'use client';

import EducationalLayout from '@/components/layout/EducationalLayout';
import TreatmentTimelineContainer from '@/components/interactive/TreatmentTimeline';

export default function CronogramaPage() {
  return (
    <EducationalLayout>
      <div style={{ padding: '20px 0' }}>
        <TreatmentTimelineContainer
          userType="anonymous"
          protocol="adulto"
        />
      </div>
    </EducationalLayout>
  );
}