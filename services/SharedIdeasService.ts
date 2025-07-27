// Simple shared service to connect Inspire Corner with Ideas Management
// This acts as a bridge until database integration is fully working

interface SharedIdea {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'Pending' | 'In Progress' | 'Approved' | 'Rejected';
  submitter_name: string;
  submitter_role: 'trainee' | 'employee' | 'admin';
  created_at: string;
  votes: number;
  total_votes: number;
  yes_votes: number;
  no_votes: number;
  comment_count: number;
  hasPoll?: boolean;
  poll?: {
    question: string;
    options: string[];
  };
}

class SharedIdeasService {
  private static ideas: SharedIdea[] = [
    // Initial mock data
    {
      id: '1',
      title: 'Dark Mode Feature',
      description: 'Add dark mode to improve user experience during night time usage.',
      category: 'Mobile App',
      status: 'Pending',
      submitter_name: 'Demo User',
      submitter_role: 'employee',
      created_at: new Date().toISOString(),
      votes: 0,
      total_votes: 0,
      yes_votes: 0,
      no_votes: 0,
      comment_count: 0
    },
    {
      id: '2',
      title: 'Team Chat Integration',
      description: 'Integrate team chat functionality within the app.',
      category: 'Communication',
      status: 'Approved',
      submitter_name: 'Jane Smith',
      submitter_role: 'trainee',
      created_at: new Date().toISOString(),
      votes: 15,
      total_votes: 15,
      yes_votes: 12,
      no_votes: 3,
      comment_count: 5,
      hasPoll: true,
      poll: {
        question: 'Do you think team chat integration would improve productivity?',
        options: ['Yes, absolutely', 'No, not needed', 'Maybe with some modifications']
      }
    }
  ];

  // Get all ideas (for admin)
  static getAllIdeas(): SharedIdea[] {
    return [...this.ideas];
  }

  // Get approved ideas (for employees to see and vote on)
  static getApprovedIdeas(): SharedIdea[] {
    return this.ideas.filter(idea => idea.status === 'Approved');
  }

  // Submit new idea (from employees)
  static submitIdea(ideaData: {
    title: string;
    description: string;
    category: string;
    submitter_name: string;
    submitter_role: 'trainee' | 'employee';
  }): SharedIdea {
    const newIdea: SharedIdea = {
      id: Date.now().toString(),
      title: ideaData.title,
      description: ideaData.description,
      category: ideaData.category,
      status: 'Pending',
      submitter_name: ideaData.submitter_name,
      submitter_role: ideaData.submitter_role,
      created_at: new Date().toISOString(),
      votes: 0,
      total_votes: 0,
      yes_votes: 0,
      no_votes: 0,
      comment_count: 0
    };

    this.ideas.push(newIdea);
    return newIdea;
  }

  // Update idea status (admin actions)
  static updateIdeaStatus(ideaId: string, status: 'Pending' | 'In Progress' | 'Approved' | 'Rejected'): boolean {
    const ideaIndex = this.ideas.findIndex(idea => idea.id === ideaId);
    if (ideaIndex !== -1) {
      this.ideas[ideaIndex].status = status;
      return true;
    }
    return false;
  }

  // Add poll to idea (admin)
  static addPollToIdea(ideaId: string, poll: { question: string; options: string[] }): boolean {
    const ideaIndex = this.ideas.findIndex(idea => idea.id === ideaId);
    if (ideaIndex !== -1) {
      this.ideas[ideaIndex].hasPoll = true;
      this.ideas[ideaIndex].poll = poll;
      return true;
    }
    return false;
  }

  // Submit vote (employees)
  static submitVote(ideaId: string, voteType: 'yes' | 'no'): boolean {
    const ideaIndex = this.ideas.findIndex(idea => idea.id === ideaId);
    if (ideaIndex !== -1) {
      if (voteType === 'yes') {
        this.ideas[ideaIndex].yes_votes += 1;
      } else {
        this.ideas[ideaIndex].no_votes += 1;
      }
      this.ideas[ideaIndex].total_votes += 1;
      this.ideas[ideaIndex].votes += 1;
      return true;
    }
    return false;
  }

  // Get idea by ID
  static getIdeaById(ideaId: string): SharedIdea | undefined {
    return this.ideas.find(idea => idea.id === ideaId);
  }
}

export default SharedIdeasService; 