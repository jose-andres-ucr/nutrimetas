// User roles on the app
export type UserRole = "professional" | "patient" | "admin";

// Common user data on the DB
type UserDataBase = {
    role: UserRole, // Role for a given user
    docId: string, // Associated datasheet document ID
    docContents: any, // Contents of datasheet
}

// Patient data on the DB
export type PatientData = UserDataBase & {
    role: "patient",
    assignedProfDocId: string, // Assigned professional's docId
}

// Professional data on the DB
export type ProfessionalData = UserDataBase & {
    role: "professional",
}

// Professional data on the DB
export type AdminData = UserDataBase & {
    role: "admin",
}

// Possible user data
export type UserData = AdminData | ProfessionalData | PatientData;

// Common user metadata on the DB
type UserMetadataBase = {
    role: UserRole, // Role for a given user
    verified: boolean
}

// Unverified user metadata on the Db
export type UnverifiedMetadata = UserMetadataBase & {
    verified: false,
    password: string, // Assigned temporary password
}

// Patient metadata on the DB
export type PatientMetadata = UserMetadataBase & {
    role: "patient",
    verified: true,
}

// Professional metadata on the DB
export type ProfessionalMetadata = UserMetadataBase & {
    role: "professional",
    verified: true,
}

// Professional metadata on the DB
export type AdminMetadata = UserMetadataBase & {
    role: "admin",
    verified: true,
}

// Possible user metadata
export type UserMetadata = AdminMetadata | ProfessionalMetadata | 
    PatientMetadata | UnverifiedMetadata;
