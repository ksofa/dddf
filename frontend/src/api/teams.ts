import { api } from './config';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

export interface Team {
  id: string;
  name: string;
  project: string;
  projectId: string;
  members: TeamMember[];
  teamLead?: string;
  status: string[];
  createdAt?: any;
}

export const getTeams = async (): Promise<Team[]> => {
  try {
    const response = await api.get('/teams');
    return response.data;
  } catch (error) {
    console.error('Error fetching teams:', error);
    throw error;
  }
};

export const getTeamByProjectId = async (projectId: string): Promise<Team> => {
  try {
    const response = await api.get(`/teams/${projectId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching team:', error);
    throw error;
  }
}; 