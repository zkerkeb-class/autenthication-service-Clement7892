export interface IUser {
  _id?: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: "admin" | "manager" | "user";
  active: boolean;
  teams?: string[]; // IDs des équipes auxquelles l'utilisateur appartient
  companyId?: string; // ID de l'entreprise principale de l'utilisateur
  lastLogin?: Date;
  provider?: "local" | "google";
  confirmationToken?: string; // Token de confirmation pour l'activation du compte
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ILoginResponse {
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    active: boolean;
    teams?: string[];
    companyId?: string;
    lastLogin?: Date;
  };
  token: string;
}
