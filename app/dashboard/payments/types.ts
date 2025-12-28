export interface Project {
  id: string;
  name: string;
  status: string;
}

export interface Unit {
  id: string;
  name: string;
}

export interface Member {
  id: string;
  name: string;
  number: string;
  unitId: string;
  unitName: string;
  status: "active" | "quit";
  defaultSharesPerMonth?: number;
}

export interface Payment {
  id: string;                     // ⬅️ REQUIRED NOW
  projectId: string;
  projectName: string;
  unitId: string;
  unitName: string;
  memberId: string;
  memberName: string;
  memberNumber: string;
  month: string;

  year: number;                   // ⬅️ make year fixed (cleaner)
  amount: number;

  createdAt?: any;
}
