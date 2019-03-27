export class SerialNumbersModel{
    customerMaster: number = 0;
    supplierMaster: number = 0;
    itemMaster: number = 0;
    unitMaster:number = 0;
    taxMaster:number = 0;
    salesHeader:number = 0;
    purchaseHeader:number = 0;
}

export interface CollapsibleMaterializeAction {
    action: string;
    params: [any, any];
}