export class FilterModel {
    startDate: String = "";
    endDate: String = "";
    paymentType: String = "";
    customerCode: number = null;
    customerName: String = "";
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