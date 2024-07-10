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
