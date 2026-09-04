export type User = {
  id: number;
  username: string;
  expires_at?: string;
};

export type UserRow = User & {
  isCurrentAdmin?: boolean;
  collectionNames?: string[];
};
