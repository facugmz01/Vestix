export interface Permission {
    id: string;
    action: string;
    subject: string;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
}
