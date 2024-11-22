import { ResourceType } from './game';

export interface Resources {
    [ResourceType.ENERGY]: number;
    [ResourceType.MATERIALS]: number;
    [ResourceType.TECHNOLOGY]: number;
    [ResourceType.INTELLIGENCE]: number;
    [ResourceType.MORALE]: number;
}

export interface ResourceModifiers {
    production: Partial<Resources>;
    consumption: Partial<Resources>;
    efficiency: number;
}

export interface ResourceCost {
    energy: number;
    materials: number;
    technology: number;
    intelligence: number;
    morale: number;
}

export interface ResourceMultipliers {
    energy: number;
    materials: number;
    technology: number;
    intelligence: number;
    morale: number;
}
