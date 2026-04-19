import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { HarvestData } from './harvestData';

export interface CampaignDoc {
  harvestData: HarvestData;
  crews: string[];
  crewCompanies: Record<string, string>;
}

export async function loadCampaign(year: number): Promise<CampaignDoc | null> {
  const ref = doc(db, 'campaigns', String(year));
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const raw = snap.data();
  return {
    crews: raw.crews ?? [],
    crewCompanies: raw.crewCompanies ?? {},
    harvestData: typeof raw.harvestData === 'string'
      ? JSON.parse(raw.harvestData)
      : (raw.harvestData ?? {}),
  };
}

export async function saveCampaign(year: number, data: CampaignDoc): Promise<void> {
  const ref = doc(db, 'campaigns', String(year));
  await setDoc(ref, {
    crews: data.crews,
    crewCompanies: data.crewCompanies,
    harvestData: JSON.stringify(data.harvestData),
  });
}
