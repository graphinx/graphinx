import { EventManagerPowerLevel } from '../index.js';
export declare function powerlevelToPermissions(level: EventManagerPowerLevel): {
    canEdit: boolean;
    canEditPermissions: boolean;
    canVerifyRegistrations: boolean;
};
export declare function permissionsToPowerlevel({ canEdit, canEditPermissions, canVerifyRegistrations, }: {
    canEdit: boolean;
    canEditPermissions: boolean;
    canVerifyRegistrations: boolean;
}): EventManagerPowerLevel;
