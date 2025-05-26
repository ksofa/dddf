export interface TeamMember {
  id: string;
  name: string;
  role: string;
  rating: number;
  status: 'available' | 'busy';
  avatar?: string;
}

export interface ProjectTeam {
  id: string;
  projectId: string;
  manager: string;
  members: TeamMember[];
  roles: {
    role: string;
    count: number;
  }[];
  startDate: string;
  estimatedDuration: string;
  budget: number;
}

export interface ProjectProposal {
  id: string;
  projectId: string;
  specialistId: string;
  specialistName: string;
  role: string;
  rate: number;
  estimatedHours: number;
  totalAmount: number;
  coverLetter: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
} 