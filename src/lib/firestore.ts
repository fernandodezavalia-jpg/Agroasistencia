import { doc, setDoc, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { HarvestData, SeasonConfig } from './harvestData';

export interface CampaignDoc {
  harvestData: HarvestData;
  crews: string[];
  crewCompanies: Record<string, string>;
  seasonConfig?: SeasonConfig;
}

function parseDoc(raw: Record<string, unknown>): CampaignDoc {
  return {
    crews: (raw.crews as string[]) ?? [],
    crewCompanies: (raw.crewCompanies as Record<string, string>) ?? {},
    harvestData: typeof raw.harvestData === 'string'
      ? JSON.parse(raw.harvestData)
      : ((raw.harvestData as HarvestData) ?? {}),
    seasonConfig:
      raw.seasonConfig !== null &&
      typeof raw.seasonConfig === 'object' &&
      typeof (raw.seasonConfig as SeasonConfig).monthlyTarget === 'number' &&
      typeof (raw.seasonConfig as SeasonConfig).quincenalTarget === 'number'
        ? (raw.seasonConfig as SeasonConfig)
        : undefined,
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

export async function fetchHistoricalCampaigns(years: number[]): Promise<Record<number, CampaignDoc | null>> {
  const results: Record<number, CampaignDoc | null> = {};
  await Promise.all(
    years.map(async (year) => {
      const snap = await getDoc(doc(db, 'campaigns', String(year)));
      results[year] = snap.exists() ? parseDoc(snap.data()) : null;
    }),
  );
  return results;
}

export async function saveCampaign(year: number, data: CampaignDoc): Promise<void> {
  const ref = doc(db, 'campaigns', String(year));
  await setDoc(ref, {
    crews: data.crews,
    crewCompanies: data.crewCompanies,
    harvestData: JSON.stringify(data.harvestData),
    seasonConfig: data.seasonConfig ?? null,
  });
}
