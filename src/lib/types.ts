export interface PlantIdentification {
  commonName: string;
  scientificName: string;
  family: string;
  confidence: "high" | "medium" | "low";
  description: string;
  careInfo: {
    sunlight: string;
    water: string;
    soil: string;
    temperature: string;
  };
  funFacts: string[];
  isEdible: boolean | null;
  isToxic: boolean | null;
  toxicityNote: string;
}

export interface IdentificationResult {
  plant: PlantIdentification;
  imageUrl: string;
  timestamp: string;
}
