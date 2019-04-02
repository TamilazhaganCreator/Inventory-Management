export class UnitModel {
    name: string;
    type: string;
    unit: number;
    code: number = null;
}

export class HsnModel {
    code: string;
    taxPercentage: number;
    id: number = null
}

export class ItemModel {
    name: string;
    code: number;
    taxPercentage: number = null;
    cgst_perc: number = null;
    sgst_perc: number = null;
    igst_perc: number = null;
    cess_perc: number = null;
    hsncode: string;
    sp: number;
    cost: number;
    unitName: string;
    unitType: string;
    unit: number;
    stock: number;
    sales: number;
    purchase: number;
    addStock: number = 0;
    removeStock: number = 0;
    lessPurchase: number = 0;
    lessSales: number = 0;
}

export class CustomerModel {
    name: string = '';
    code: number;
    address: string = "";
    mobileNo: number;
    email: string = ''
    landline: number;
    gstNo: string = "";
    amount: number = 0
    location: number = null;
    moneyReceived: number = 0;
    creditMoney: number = 0;
}

export class TaxModel {
    code: number = null;
    cgst_perc: number = null;
    sgst_perc: number = null;
    igst_perc: number = null;
    cess_perc: number = null;
}