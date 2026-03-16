import { PlatformRole } from '@flow/shared';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type RoleConfig<T = string> = {
  value: T;
  label: string;
  description: string;
};

const PLATFORM_ROLES: RoleConfig<PlatformRole>[] = [
  {
    value: PlatformRole.ADMIN,
    label: 'Admin',
    description: 'Full access to all projects and platform settings',
  },
  {
    value: PlatformRole.OPERATOR,
    label: 'Operator',
    description: 'Access and edit flows in all projects, no platform settings',
  },
  {
    value: PlatformRole.MEMBER,
    label: 'Member',
    description: "Access to personal project and any team projects they're invited to",
  },
];

const PROJECT_ROLE_DESCRIPTIONS: Record<string, string> = {
  Admin: 'Manage project settings, members, connections, and git sync',
  Editor: 'Build, publish, and manage flows',
  Viewer: 'View flows and monitor run history',
};

export const getProjectRoleDescription = (roleName: string): string => {
  return PROJECT_ROLE_DESCRIPTIONS[roleName] || '';
};

interface RoleSelectorProps {
  type: 'platform' | 'project';
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  roles?: Array<{ name: string }>;
}

export const RoleSelector = ({
  type,
  value,
  onValueChange,
  disabled = false,
  placeholder,
  roles = [],
}: RoleSelectorProps) => {
  const isPlatform = type === 'platform';

  const label = isPlatform ? 'Platform Roles' : 'Project Roles';

  const options = isPlatform
    ? PLATFORM_ROLES.map((role) => ({
        value: role.value,
        label: role.label,
        description: role.description,
      }))
    : roles.map((role) => ({
        value: role.name,
        label: role.name,
        description: getProjectRoleDescription(role.name),
      }));

  const selectedRole = options.find((r) => r.value === value);

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className="w-full">
        {selectedRole ? (
          <span className="font-normal">{selectedRole.label}</span>
        ) : (
          <SelectValue placeholder={placeholder || 'Select Role'} />
        )}
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>{label}</SelectLabel>
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className="py-3"
            >
              <div className="flex flex-col gap-1">
                <span className="font-medium">{option.label}</span>
                <span className="text-xs text-muted-foreground">
                  {option.description}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};

interface RoleDropdownProps {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  roles: Array<{ name: string }>;
  className?: string;
}

export const RoleDropdown = ({
  value,
  onValueChange,
  disabled = false,
  roles,
  className = '',
}: RoleDropdownProps) => {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={`w-[150px] justify-between ${className}`}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>{'Roles'}</SelectLabel>
          {roles.map((role) => (
            <SelectItem key={role.name} value={role.name} className="py-3">
              <div className="flex flex-col gap-1">
                <span className="font-medium">{role.name}</span>
                <span className="text-xs text-muted-foreground">
                  {getProjectRoleDescription(role.name)}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};
