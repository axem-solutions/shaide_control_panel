export type User = {
  id: number;
  auth_token: string;
  expires_at?: string;
};

export type UserRow = User & {
  isCurrentAdmin?: boolean;
  collectionNames?: string[];
};
