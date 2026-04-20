import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase';
import type { HarvestData } from './harvestData';

export interface CampaignDoc {
  harvestData: HarvestData;
  crews: string[];
  crewCompanies: Record<string, string>;
}

function parseDoc(raw: Record<string, unknown>): CampaignDoc {
  return {
    crews: (raw.crews as string[]) ?? [],
    crewCompanies: (raw.crewCompanies as Record<string, string>) ?? {},
    harvestData: typeof raw.harvestData === 'string'
      ? JSON.parse(raw.harvestData)
      : ((raw.harvestData as HarvestData) ?? {}),
  };
}

export function subscribeCampaign(
  year: number,
  onData: (doc: CampaignDoc | null) => void,
  onError: (err: Error) => void,
): () => void {
  const ref = doc(db, 'campaigns', String(year));
  return onSnapshot(ref, (snap) => {
    onData(snap.exists() ? parseDoc(snap.data()) : null);
  }, onError);
}

export async function saveCampaign(year: number, data: CampaignDoc): Promise<void> {
  const ref = doc(db, 'campaigns', String(year));
  await setDoc(ref, {
    crews: data.crews,
    crewCompanies: data.crewCompanies,
    harvestData: JSON.stringify(data.harvestData),
  });
}
