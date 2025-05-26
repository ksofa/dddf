export interface User {
  id?: string;
  uid?: string;
  displayName: string;
  email: string;
  roles: string[];
  profile?: {
    rating: number;
    totalReviews: number;
  };
  avatarUrl?: string;
  profession?: string;
  rating?: number;
  name?: string;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  pmId: string;
  memberIds: string[];
  projectId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Application {
  id: string;
  type: 'team_invitation' | 'project_application' | 'client_request';
  status: 'pending' | 'accepted' | 'declined';
  senderId: string;
  receiverId: string;
  teamId?: string;
  projectId?: string;
  rate?: number;
  startDate?: string;
  estimatedDuration?: string;
  coverLetter?: string;
  createdAt: string;
  updatedAt: string;
  sender?: User;
  receiver?: User;
  team?: Team;
  project?: Project;
  assignedPM?: string;
} 