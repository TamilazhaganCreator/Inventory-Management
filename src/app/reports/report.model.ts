export class FilterModel {
    startDate: String = "";
    endDate: String = "";
    paymentType: String = "";
    customerCode: number = null;
    customerName: String = "";
    startTimestamp: number = null;
    endTimestamp: number = null;
    personAmount: number = 0;
}

export class ItemFilterModel {
    name: string = null
    sortType: string = null;
}

export class PersonFilterModel {
    name: string = null
    sortType: string = null;
    amountType: String = null
}