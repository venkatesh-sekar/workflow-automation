import { create } from 'zustand';

type FlowErrorDialogParams = {
  title: string;
  description: React.ReactNode;
  error: unknown;
};
interface FlowErrorDialogStore {
  params: FlowErrorDialogParams | null;
  openDialog: (params: FlowErrorDialogParams) => void;
  closeDialog: () => void;
}

export const useFlowErrorDialogStore = create<FlowErrorDialogStore>((set) => ({
  params: null,
  openDialog: (params) => set({ params }),
  closeDialog: () => set({ params: null }),
}));
