"use client";

import { AudienceCard, type AudienceBucket } from "./audience-card";

type AudienceData = {
  deviceType: AudienceBucket[];
  browser: AudienceBucket[];
  os: AudienceBucket[];
  locale: AudienceBucket[];
};

type Props = {
  data?: AudienceData;
  isLoading?: boolean;
};

export function AudienceGrid({ data, isLoading }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <AudienceCard
        title="Device"
        data={data?.deviceType ?? []}
        isLoading={isLoading}
      />
      <AudienceCard
        title="Browser"
        data={data?.browser ?? []}
        isLoading={isLoading}
      />
      <AudienceCard
        title="OS"
        data={data?.os ?? []}
        isLoading={isLoading}
      />
      <AudienceCard
        title="Locale"
        data={data?.locale ?? []}
        isLoading={isLoading}
      />
    </div>
  );
}
