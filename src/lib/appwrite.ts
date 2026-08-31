import { Account, Client, Functions, OAuthProvider } from 'appwrite';

const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT as string | undefined;
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID as string | undefined;
export const appwriteConfigured = Boolean(endpoint && projectId);
export const client = new Client();
if (endpoint && projectId) client.setEndpoint(endpoint).setProject(projectId);
export const account = new Account(client);
export const functions = new Functions(client);
export { OAuthProvider };
