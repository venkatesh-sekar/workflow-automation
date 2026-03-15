import React from 'react';

export type FeatureKey =
  | 'PROJECTS'
  | 'BRANDING'
  | 'PIECES'
  | 'TEMPLATES'
  | 'TEAM'
  | 'GLOBAL_CONNECTIONS'
  | 'USERS'
  | 'EVENT_DESTINATIONS'
  | 'API'
  | 'SSO'
  | 'AUDIT_LOGS'
  | 'ENVIRONMENT'
  | 'ISSUES'
  | 'ANALYTICS'
  | 'ALERTS'
  | 'ENTERPRISE_PIECES'
  | 'UNIVERSAL_AI'
  | 'SIGNING_KEYS'
  | 'CUSTOM_ROLES'
  | 'AGENTS'
  | 'TABLES'
  | 'TODOS'
  | 'BILLING'
  | 'MCPS'
  | 'SECRET_MANAGERS';

type LockedFeatureGuardProps = {
  children: React.ReactNode;
  locked: boolean;
  lockTitle: string;
  lockDescription: string;
  lockVideoUrl?: string;
  lockDocumentationUrl?: string;
};

export const LockedFeatureGuard = ({
  children,
  locked,
  lockTitle,
  lockDescription,
  lockVideoUrl,
  lockDocumentationUrl,
}: LockedFeatureGuardProps) => {
  if (!locked) {
    return children;
  }

  return (
    <div className="flex w-full flex-col items-center justify-center gap-2">
      <div className="pt-8 text-center flex flex-col gap-2 justify-center items-center">
        <h1 className="text-3xl font-bold">{lockTitle}</h1>
        <div className="text-center w-[485px] my-4 flex flex-col gap-2 justify-center items-center">
          <p className="text-md leading-relaxed text-muted-foreground">
            {lockDescription}
            {lockDocumentationUrl && (
              <>
                {' '}
                <a
                  href={lockDocumentationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  Learn more
                </a>
              </>
            )}
          </p>

        </div>

        {lockVideoUrl && (
          <video
            autoPlay
            loop
            muted
            playsInline
            className="max-w-[70vh] rounded-lg"
            controls={false}
            src={lockVideoUrl}
          />
        )}
      </div>
    </div>
  );
};

export default LockedFeatureGuard;
