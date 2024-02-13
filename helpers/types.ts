import { Schema } from "@/amplify/data/resource";

export type Nullable<T> = T | null;
export type MappedAccount = {
  name: string;
};
export type SixWeekCycle = {
  name: string;
  startDate: string;
};
export type SixWeekBatch = {
  id: string;
  idea: string;
  context: string;
  sixWeekCycle: SixWeekCycle;
};
export type Activity = {
  id: string;
  finishedOn: Nullable<string>;
  notes: Nullable<string>;
  createdAt: string;
  forProjects?: { projects: Project }[];
};
export type Project = {
  id: string;
  project: string;
  context: string;
  batches: { sixWeekBatch: SixWeekBatch }[];
  accounts: { account: MappedAccount }[];
};
export type ProjectTask = {
  id: string;
  task: string;
  done?: Nullable<boolean>;
  projects: Project;
  createdAt: string;
  timeInvested?: Nullable<number>;
};
export type DayPlan = {
  id: string;
  day: string;
  dayGoal: string;
  done?: Nullable<boolean>;
};
export type SubNextFunctionParam<T> = {
  items: T[];
  isSynced: boolean;
};
export type AccountRole = {
  role?: Nullable<string>;
  startDate?: Nullable<string>;
  endDate?: Nullable<string>;
  company?: MappedAccount;
};
export type Participant = {
  id: string;
  name: string;
  accountRoles: AccountRole[];
};
export type Meeting = {
  id: string;
  topic: string;
  meetingOn?: Nullable<string>;
  createdAt: string;
  timeInvested?: Nullable<number>;
  participants: { person: Participant }[];
  activities: Activity[];
};
