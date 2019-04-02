import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, ElementRef, EventEmitter, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MaterializeAction } from 'angular2-materialize';
import * as html2canvas from 'html2canvas';
import * as jspdf from 'jspdf';
import { Subscription } from 'rxjs';
import { GenericLovService } from 'src/app/genericlov/genericlov.service';
import { GlobalService } from 'src/app/global.service';
import { CustomerModel, ItemModel, TaxModel } from 'src/app/master/master.model';
import { SalesDetailModel, SalesHeaderModel } from '../transaction.model';
import { TransactionService } from '../transaction.service';
import { SerialNumbersModel } from './../../global.model';
import { MasterService } from './../../master/master.service';

@Component({
  selector: 'app-salestransaction',
  templateUrl: './salestransaction.component.html',
  styleUrls: ['./salestransaction.component.css'],
  animations: [
    trigger("rotatedUp", [
      state("default", style({ transform: "rotate(0)" })),
      state("rotated", style({ transform: "rotate(-180deg)" })),
      transition("rotated => default", animate("100ms ease-out")),
      transition("default => rotated", animate("100ms ease-in"))
    ])
  ]
})
export class SalestransactionComponent implements OnInit {

  invoiceDatePickerParams = [
    {
      format: "dd/mm/yyyy",
      close: "Ok",
      clear: "",
      max: true
    }
  ];
  chqModalParams = [
    {
      startingTop: '10%',
      inDuration: 300,
      outDuration: 200,
      dismissible: false,
      ready: () => {
        this.saveChqButton.nativeElement.blur()
        this.clearChqButton.nativeElement.blur()
      }, complete: () => {
        this.salesHeader.paidAmt = this.salesHeader.chqAmt
      }
    }
  ]
  confirmationModalParams = [
    {
      startingTop: '30%',
      endingTop: '30%'
    }
  ]

  paymentTypeShow = true
  salesHeader = new SalesHeaderModel();
  salesDetails: SalesDetailModel[] = []
  private subscriptions: Subscription[] = []
  confimationModalHeader: string = ""
  chqModalAction = new EventEmitter<string | MaterializeAction>();
  confirmationModal = new EventEmitter<string | MaterializeAction>();
  private serials = new SerialNumbersModel()
  private latestId = 0
  deletePwd = ""
  @ViewChildren("itemCodeInputs") private itemCodeInputs: QueryList<any>;
  @ViewChildren("quantityInputs") private quantityInputs: QueryList<any>;
  @ViewChildren("spInputs") private spInputs: QueryList<any>;
  @ViewChild("clearChqButton") private clearChqButton: ElementRef;
  @ViewChild("saveChqButton") private saveChqButton: ElementRef;
  @ViewChild("invoiceNoInput") private invoiceNoInput: ElementRef;
  @ViewChild("otherChargesInput") private otherChargesInput: ElementRef;
  @ViewChild("paidAmtInput") private paidAmtInput: ElementRef;
  @ViewChild("custNameInput") private custNameInput: ElementRef;
  private alphaNumericRegex: RegExp = /^[a-zA-Z0-9\._-]*$/
  private tenNumberWithTwoDigitsFormatRegex: RegExp = /^\d{0,10}(?:\.\d{0,2})?$/;
  billShow: boolean = false

  constructor(private lovService: GenericLovService, private global: GlobalService, private service: TransactionService,
    private router: ActivatedRoute, private masterService: MasterService, private routerChange: Router) {
    this.subscriptions[0] = this.lovService.getLovItem()
      .subscribe(res => {
        if (res[1] == "itemsSales") {
          var item = res[0] as ItemModel
          let index = this.salesDetails.findIndex(i => i.itemCode == item.code)
          if (index == -1) {
            this.salesDetails[res[2]].itemCode = item.code
            this.salesDetails[res[2]].itemName = item.name
            this.salesDetails[res[2]].hsncode = item.hsncode
            this.salesDetails[res[2]].taxPercentage = item.taxPercentage
            this.salesDetails[res[2]].cgst_perc = item.cgst_perc
            this.salesDetails[res[2]].sgst_perc = item.sgst_perc
            this.salesDetails[res[2]].igst_perc = item.igst_perc
            this.salesDetails[res[2]].cess_perc = item.cess_perc
            this.salesDetails[res[2]].unitType = item.unitType
            this.salesDetails[res[2]].unitName = item.unitName
            this.salesDetails[res[2]].stockValue = item.stock
            this.salesDetails[res[2]].sales = item.sales
            this.salesDetails[res[2]].purchase = item.purchase
            this.salesDetails[res[2]].unit = item.unit
            this.salesDetails[res[2]].sp = item.sp
            this.setElementFocus(this.quantityInputs, res[2])
          } else {
            this.setElementFocus(this.itemCodeInputs, res[2])
            this.global.showToast("Item duplication not allowed", "warning", false)
          }
        } else if (res[1] == "Customer") {
          var customer = res[0] as CustomerModel
          this.salesHeader.customerName = customer.name
          this.salesHeader.customerAddress = customer.address
          this.salesHeader.customerGSTNo = customer.gstNo
          this.salesHeader.customerAmt = customer.amount
          this.salesHeader.customerCode = customer.code
          this.salesHeader.customerValid = true
          this.salesHeader.customerLocation = customer.location
          this.invoiceNoInput.nativeElement.focus();
        } else if (res[1] == "tax") {
          let tax = res[0] as TaxModel
          this.salesDetails[res[2]].taxPercentage = tax.cess_perc + tax.cgst_perc + tax.sgst_perc
          this.salesDetails[res[2]].cgst_perc = tax.cgst_perc
          this.salesDetails[res[2]].sgst_perc = tax.sgst_perc
          this.salesDetails[res[2]].igst_perc = tax.igst_perc
          this.salesDetails[res[2]].cess_perc = tax.cess_perc
          this.salesDetailsCalculation(res[2])
        }
      })
    this.subscriptions[1] = this.router.queryParams.
      subscribe(params => {
        let id = params['salesId']
        if (id) {
          this.service.getHeaderDetails("salesheader", id)
            .subscribe((res) => {
              this.global.routeLoader = true
              let temHeader = res.data() as SalesHeaderModel
              this.masterService.getItem("customermaster", temHeader.customerCode.toString())
                .subscribe((cust) => {
                  let customer = cust.data() as CustomerModel
                  temHeader.customerGSTNo = customer.gstNo
                  temHeader.customerAmt = customer.amount
                  temHeader.customerLocation = customer.location
                  this.service.getTransactionDetails("salesdetail", id)
                    .then((res) => {
                      let index = 0
                      this.salesDetails = []
                      res.forEach(doc => {
                        this.salesDetails[index] = doc.data() as SalesDetailModel
                        index++;
                      })
                      temHeader.invoiceDate = new Date(temHeader.timestamp)
                      this.salesHeader = temHeader
                      this.salesHeader.customerValid = true
                      this.global.routeLoader = false
                      this.global.showToast("Sales details for that row - [ READ ONLY MODE ]", "success", true)
                    }, error => {
                      this.global.showToast("Error occurred" + error, "error", true)
                    })
                }, error => {
                  this.global.showToast("Error occurred" + error, "error", true)
                })
            }, error => {
              this.global.showToast("Error occurred" + error, "error", true)
            })
        }
      });
  }

  ngOnInit() {
    setTimeout(() => {
      this.getLatestItem()
    }, 100);
  }

  resetSales() {
    this.salesHeader.customerValid = false
    this.salesHeader = new SalesHeaderModel()
    this.salesHeader.invoiceDate = new Date()
    this.salesHeader.timestamp = new Date().getTime()
    this.salesDetails = []
    this.addInitialItem();
  }

  private addInitialItem() {
    this.salesDetails.push(new SalesDetailModel());
    this.salesDetails = [...this.salesDetails];
  }

  showItemLovModal(event, collection, index) {
    if (event.keyCode == 13) {
      if (this.salesHeader.customerValid) {
        if (this.salesHeader.invoiceDate != null) {
          if (this.salesHeader.invoiceNo != null && this.salesHeader.invoiceNo != "") {
            if (this.salesHeader.paymentType != null) {
              this.lovService.showLovModal(true, collection, "", index)
            } else {
              this.global.showToast("Kindly select the payment type", "warning", false)
            }
          } else {
            this.invoiceNoInput.nativeElement.focus();
            this.global.showToast("Kindly enter the invoice no", "warning", false)
          }
        } else {
          this.global.showToast("Kindly select the invoice date", "warning", false)
        }
      } else {
        this.custNameInput.nativeElement.focus();
        this.global.showToast("Kindly add the customer details", "warning", false)
      }
    }
  }

  showLovModal(event, collection, index) {
    if (event.keyCode == 13) {
      this.lovService.showLovModal(true, collection, "", index)
    }
  }

  removeTax(rowIndex) {
    this.salesDetails[rowIndex].taxPercentage = 0
    this.salesDetails[rowIndex].cgst_perc = 0
    this.salesDetails[rowIndex].sgst_perc = 0
    this.salesDetails[rowIndex].igst_perc = 0
    this.salesDetails[rowIndex].cess_perc = 0
    this.salesDetailsCalculation(rowIndex)
    this.lovService.showLovModal(true, "tax", "", rowIndex)
  }

  setElementFocus(inputs: QueryList<any>, rowIndex: number) {
    setTimeout(() => {
      let items = inputs.toArray();
      if (items[rowIndex]) {
        let element = items[rowIndex].nativeElement;
        element.focus();
        element.select();
      }
    }, 100);
  }

  addRow(event) {
    if (event.keyCode == 43) {
      this.addItem()
    }
  }

  addItem() {
    let index = this.salesDetails.length - 1
    if (this.salesDetails[this.salesDetails.length - 1].itemName) {
      if (this.checkRowValid(index, this.salesDetails[index].quantity, "quantityInputs") && this.checkRowValid(index, this.salesDetails[index].sp, "spInputs")) {
        this.salesDetails.push(new SalesDetailModel())
        this.setElementFocus(this.itemCodeInputs, this.salesDetails.length - 1);
      }
    } else {
      this.setElementFocus(this.itemCodeInputs, this.salesDetails.length - 1);
      this.global.showToast("Kindly enter the item details", "warning", false)
    }
  }

  checkField(index: number, event, format: string, field: string) {
    if (this.global[format].test(event.target.value)) {
      if (field == 'quantity' && +(event.target.value) > this.salesDetails[index].stockValue) {
        event.target.value = this.salesDetails[index].quantity
        this.global.showToast("Reached the maximum stock value", "warning", false)
        return;
      }
      if (event.target.value != '')
        this.salesDetails[index][field] = +(event.target.value)
      else
        this.salesDetails[index][field] = null
      this.salesDetailsCalculation(index)
    } else {
      event.target.value = this.salesDetails[index][field] ? this.salesDetails[index][field] : ''
    }
  }

  salesDetailsCalculation(index: number) {
    if (this.salesHeader.customerValid) {
      if (this.salesDetails[index].quantity && this.salesDetails[index].sp) {
        this.salesDetails[index].totalUnit = this.salesDetails[index].quantity * this.salesDetails[index].unit
        let totalAmt = this.salesDetails[index].totalUnit * this.salesDetails[index].sp
        this.salesDetails[index].cessAmt = totalAmt * ((this.salesDetails[index].cess_perc) / 100)
        if (this.salesHeader.customerLocation == 0) {
          this.salesDetails[index].sgstAmt = totalAmt * ((this.salesDetails[index].cgst_perc) / 100)
          this.salesDetails[index].cgstAmt = totalAmt * ((this.salesDetails[index].sgst_perc) / 100)
          this.salesDetails[index].igstAmt = 0
          this.salesDetails[index].netAmt = totalAmt + this.salesDetails[index].sgstAmt + this.salesDetails[index].cgstAmt + this.salesDetails[index].cessAmt
        } else if (this.salesHeader.customerLocation == 1) {
          this.salesDetails[index].igstAmt = totalAmt * (this.salesDetails[index].taxPercentage / 100)
          this.salesDetails[index].cgstAmt = this.salesDetails[index].sgstAmt = 0
          this.salesDetails[index].netAmt = totalAmt + this.salesDetails[index].igstAmt + this.salesDetails[index].cessAmt
        }
        this.salesHeaderCalculation();
      }
    }
  }

  setInvoiceDate(event) {
    var dateArray = event.target.value.toString().split("/")
    this.salesHeader.invoiceDate = new Date(dateArray[2] + "-" + dateArray[1] + "-" + dateArray[0] + " 00:00:00")
    this.salesHeader.timestamp = this.salesHeader.invoiceDate.getTime()
  }



  salesHeaderCalculation() {
    if (this.salesHeader.customerLocation == 0) {
      let cgst = this.salesDetails.filter(item => item.cgstAmt != null).map(item => item.cgstAmt).reduce((a, b) => a + b, 0)
      let sgst = this.salesDetails.filter(item => item.sgstAmt != null).map(item => item.sgstAmt).reduce((a, b) => a + b, 0)
      let cess = this.salesDetails.filter(item => item.cessAmt != null).map(item => item.cessAmt).reduce((a, b) => a + b, 0)
      this.salesHeader.taxAmt = cgst + sgst + cess
    } else if (this.salesHeader.customerLocation == 1) {
      let igst = this.salesDetails.filter(item => item.igstAmt != null).map(item => item.igstAmt).reduce((a, b) => a + b, 0)
      let cess = this.salesDetails.filter(item => item.cessAmt != null).map(item => item.cessAmt).reduce((a, b) => a + b, 0)
      this.salesHeader.taxAmt = igst + cess
    }
    this.salesHeader.netAmt = this.salesDetails.filter(item => item.netAmt != null).map(item => item.netAmt).reduce((a, b) => a + b, 0) + this.salesHeader.otherCharges
  }

  clearCustomerDetails() {
    this.salesHeader.customerValid = false
    this.salesHeader.customerAmt = null
    this.salesHeader.customerAddress = null
    this.salesHeader.customerGSTNo = null
    this.salesHeader.customerName = null
    this.salesHeader.customerLocation = null
  }

  setPaymentType(event) {
    this.salesHeader.paymentType = +(event.target.value)
    if (this.salesHeader.paymentType == 2) {
      this.openChqModal()
    } else {
      this.salesHeader.chqDate = null
      this.salesHeader.chqNo = 0
      this.salesHeader.chqAmt = null
      this.salesHeader.chqBank = null
      this.salesHeader.timestamp = null
      this.salesHeader.paidAmt = null
    }
    if (this.salesHeader.paymentType == 0) {
      this.salesHeader.paidAmt = 0
    } else if (this.salesHeader.paymentType == 1) {
      this.salesHeader.paidAmt = null
    }
  }

  showChq() {
    if (this.salesHeader.paymentType == 2) {
      this.openChqModal()
    }
  }

  openChqModal() {
    this.chqModalAction.emit({ action: "modal", params: ["open"] });
  }

  openSubmitModal() {
    this.confirmationModal.emit({ action: "modal", params: ["open"] });
  }

  closeChqModal() {
    this.chqModalAction.emit({ action: "modal", params: ["close"] });
  }


  checkNumberValue(event, fieldName) {
    if (this.global.numberOnlyFormatRegex.test(event.target.value)) {
      if (event.target.value != '')
        this.salesHeader[fieldName] = +(event.target.value)
      else
        this.salesHeader[fieldName] = null
    } else {
      event.target.value = this.salesHeader[fieldName] ? this.salesHeader[fieldName] : ''
    }
  }

  saveChqDetails() {
    if (this.salesHeader.chqDate != null && this.salesHeader.chqNo != null && this.salesHeader.chqAmt
      && (this.salesHeader.chqBank != null && this.salesHeader.chqBank != "")) {
      this.closeChqModal()
      this.global.showToast("Cheque details are saved successfully", "warning", false)
    } else {
      this.global.showToast("Kindly fill all the details", "warning", false)
    }
  }

  clearChqDetails() {
    if (!this.salesHeader.id) {
      this.paymentTypeShow = false
      setTimeout(() => {
        this.paymentTypeShow = true
      }, 100);
      this.salesHeader.paymentType = 0
      if (this.salesHeader.chqDate != null && this.salesHeader.chqNo != null && this.salesHeader.chqAmt
        && (this.salesHeader.chqBank != null && this.salesHeader.chqBank != "")) {
        this.salesHeader.chqDate = null
        this.salesHeader.chqNo = 0
        this.salesHeader.chqAmt = null
        this.salesHeader.chqBank = ""
        this.global.showToast("Cheque details are cleared successfully", "warning", false)
      }
    }
  }

  checkInvoiceNo(event) {
    if (this.alphaNumericRegex.test(event.target.value)) {
      this.salesHeader.invoiceNo = event.target.value
    } else {
      event.target.value = this.salesHeader.invoiceNo
    }
  }

  clearAll() {
    this.global.loader = true
    this.resetSales()
    this.global.loader = false
    this.routerChange.navigate(['/transaction/sales'])
    this.global.showToast("Cleared Successfully", "warning", false)
  }

  setBankName(event) {
    this.salesHeader.chqBank = event.target.value
  }

  clearProcess() {
    this.confimationModalHeader = "Clear all"
    this.openSubmitModal()
  }

  deleteModal() {
    this.confimationModalHeader = "Delete"
    this.openSubmitModal()
  }

  endProcess() {
    if (this.salesHeader.id) {
      this.printBill(false)
    } else {
      this.submitProcess()
    }
  }


  submitProcess() {
    if (this.salesHeader.customerValid) {
      if (this.salesHeader.invoiceDate != null) {
        if (this.salesHeader.invoiceNo != null && this.salesHeader.invoiceNo != "") {
          if (this.salesHeader.paymentType != null) {
            if (this.salesHeader.otherCharges != null) {
              if (this.salesHeader.paidAmt != null) {
                if (this.salesDetails.length > 0 && this.salesDetails[0].itemName != null && this.salesDetails[0].itemName != '') {
                  if (this.salesDetails[this.salesDetails.length - 1].itemName == null) {
                    this.salesDetails.splice(this.salesDetails.length - 1, 1)
                  }
                  this.salesHeader.timestamp = this.salesHeader.invoiceDate.getTime()
                  this.confimationModalHeader = "Submit"
                  this.openSubmitModal()
                } else {
                  this.setElementFocus(this.itemCodeInputs, 0);
                  this.global.showToast("Kindly enter the item details", "warning", false)
                }
              } else {
                this.paidAmtInput.nativeElement.focus();
                this.global.showToast("Kindly enter the paid amount", "warning", false)
              }
            } else {
              this.otherChargesInput.nativeElement.focus();
              this.global.showToast("Kindly enter the other charges", "warning", false)
            }
          } else {
            this.global.showToast("Kindly select the payment type", "warning", false)
          }
        } else {
          this.invoiceNoInput.nativeElement.focus();
          this.global.showToast("Kindly enter the invoice no", "warning", false)
        }
      } else {
        this.global.showToast("Kindly select the invoice date", "warning", false)
      }
    } else {
      this.custNameInput.nativeElement.focus();
      this.global.showToast("Kindly add the customer details", "warning", false)
    }
  }

  yesButtonProcess() {
    if (this.confimationModalHeader == "Clear all") {
      this.clearAll()
    } else if (this.confimationModalHeader == "Submit") {
      this.submitToServer()
    } else if (this.confimationModalHeader == "Delete") {
      let pwd = this.salesHeader.id + this.salesHeader.netAmt + new Date().getDate()
      if (this.deletePwd == pwd.toString()) {
        this.delete()
      } else {
        this.global.showToast("Invalid password", "warning", false)
      }
    }
  }


  submitToServer() {
    this.global.loader = true
    this.salesHeader.id = this.latestId
    this.service.addSalesHeader(this.salesHeader)
      .then(res => {
        this.service.addSalesDetail(this.salesDetails, this.salesHeader.id.toString())
          .then(res => {
            this.service.updateItemDetails(this.getItemArray(true))
              .then(res => {
                let amount = this.getCustomerAmt()
                this.service.updateCustomerAmount("customermaster", this.salesHeader.customerCode.toString(), amount)
                  .then(res => {
                    this.printBill(true)
                  }).catch(e => {
                    this.global.showToast("Error occured" + e, "error", true)
                  })
              }).catch(e => {
                this.global.showToast("Error occured" + e, "error", true)
              })
          }).catch(e => {
            this.global.showToast("Error occured" + e, "error", true)
          })
      }).catch(e => {
        this.global.showToast("Error occured" + e, "error", true)
      })
  }

  private getLatestItem() {
    this.global.loader = true;
    this.global.getLatestSerial().subscribe(res => {
      if (res.docs.length > 0) {
        this.serials = res.docs[0].data() as SerialNumbersModel
        this.latestId = this.serials.salesHeader + 1
      } else {
        this.latestId = 1
      }
      this.resetSales()
      this.global.loader = false
    }, error => {
      this.global.showToast("Error occurred" + error, "error", true)
    })
  }

  deleteItem(rowIndex) {
    this.salesDetails.splice(rowIndex, 1)
    this.global.showToast("Deleted an item", "success", false)
    if (this.salesDetails.length == 0) {
      this.addInitialItem()
    }
    this.salesHeaderCalculation()
  }

  updateSerials() {
    this.serials.salesHeader = this.serials.salesHeader + 1
    this.global.updateLatestSerial(this.serials)
      .then(res => {
        this.latestId++;
        this.resetSales()
        this.global.loader = false
        this.global.showToast("Saved successfully", "success", false)
      }).catch(e => { this.global.showToast("Error occured" + e, "error", true) })
  }

  getCustomerAmt(): number {
    if (this.salesHeader.paymentType == 0) {
      return this.salesHeader.customerAmt - this.salesHeader.netAmt;
    } else if (this.salesHeader.paymentType == 1) {
      let amt = this.salesHeader.paidAmt - this.salesHeader.netAmt
      return this.salesHeader.customerAmt + amt
    } else if (this.salesHeader.paymentType == 2) {
      let amt = this.salesHeader.chqAmt - this.salesHeader.netAmt
      return this.salesHeader.customerAmt + amt
    }
  }

  removeCustomerAmt(): number {
    if (this.salesHeader.paymentType == 0) {
      return this.salesHeader.customerAmt + this.salesHeader.netAmt;
    } else if (this.salesHeader.paymentType == 1) {
      let amt = this.salesHeader.paidAmt - this.salesHeader.netAmt
      return this.salesHeader.customerAmt - amt
    } else if (this.salesHeader.paymentType == 2) {
      let amt = this.salesHeader.chqAmt - this.salesHeader.netAmt
      return this.salesHeader.customerAmt - amt
    }
  }

  getItemArray(add: boolean): ItemModel[] {
    let items: ItemModel[] = []
    let index = 0
    this.salesDetails.forEach((element) => {
      items[index] = new ItemModel()
      items[index].code = this.salesDetails[index].itemCode
      items[index].unit = this.salesDetails[index].unit
      items[index].unitName = this.salesDetails[index].unitName
      items[index].unitType = this.salesDetails[index].unitType
      if (add) {
        items[index].stock = this.salesDetails[index].stockValue - this.salesDetails[index].quantity
        items[index].sales = this.salesDetails[index].sales + this.salesDetails[index].quantity
      } else {
        items[index].stock = this.salesDetails[index].stockValue + this.salesDetails[index].quantity
        items[index].sales = this.salesDetails[index].sales - this.salesDetails[index].quantity
      }
      items[index].cgst_perc = this.salesDetails[index].cgst_perc
      items[index].sgst_perc = this.salesDetails[index].sgst_perc
      items[index].igst_perc = this.salesDetails[index].igst_perc
      items[index].cess_perc = this.salesDetails[index].cess_perc
      items[index].hsncode = this.salesDetails[index].hsncode
      items[index].taxPercentage = this.salesDetails[index].taxPercentage
      items[index].purchase = this.salesDetails[index].purchase
      index++;
    })
    return items
  }


  checkValue(field: string, event, index) {
    if (this.salesDetails[index].itemName) {
      if (event.target.value == '' || event.target.value == null || event.target.value == 0) {
        this.setElementFocus(this[field], index)
        this.global.showToast("Kindly enter the " + field.replace("Inputs", "") + " value", "warning", false)
      }
    }
  }

  checkRowValid(index, value, field): boolean {
    if (this.salesDetails[index].itemName) {
      if (value == '' || value == null || value == 0) {
        this.setElementFocus(this[field], index)
        this.global.showToast("Kindly enter the " + field.replace("Inputs", "") + " value", "warning", false)
        return false
      }
      return true
    } else {
      return false
    }
  }

  fullItemsValid(): boolean {
    for (let index = 0; index < this.salesDetails.length; index++) {
      if (!this.checkRowValid(index, this.salesDetails[index].quantity, "quantityInputs") || !this.checkRowValid(index, this.salesDetails[index].sp, "spInputs")) {
        return false
      }
    }
    return true
  }

  public printBill(update: boolean) {
    this.global.loader = true
    this.billShow = true
    setTimeout(() => {
      var data = document.getElementById('bill');
      html2canvas(data).then(canvas => {
        const contentDataURL = canvas.toDataURL('image/png')
        let pdf = new jspdf('p', 'mm', 'a4'); // A4 size page of PDF
        var position = 0;
        pdf.addImage(contentDataURL, 'PNG', 0, 0)
        let date = this.salesHeader.invoiceDate.getDate() + "/" + (this.salesHeader.invoiceDate.getMonth() + 1) + "/" + this.salesHeader.invoiceDate.getFullYear()
        pdf.save("SALES - " + this.salesHeader.customerName + "- Invoice_no_" + this.salesHeader.invoiceNo + " - [ " + date + " ]" + '.pdf', { returnPromise: true }).then(result => {
          this.billShow = false
          if (update) {
            this.updateSerials();
          } else {
            this.resetSales();
            this.global.loader = false
            this.routerChange.navigate(['/transaction/sales'])
          }
        })
      });
    }, 100);
  }


  delete() {
    this.global.loader = true
    this.service.deleteSalesHeader(this.salesHeader)
      .then(res => {
        this.service.deleteSalesDetail(this.salesDetails, this.salesHeader.id.toString())
          .then(res => {
            let amount = this.removeCustomerAmt()
            this.service.updateCustomerAmount("customermaster", this.salesHeader.customerCode.toString(), amount)
              .then(res => {
                this.global.loader = false
                this.resetSales()
                this.routerChange.navigate(['/transaction/sales'])
                this.global.showToast("Sales deleted successfully", "success", false)
              }).catch(e => {
                this.global.showToast("Error occured" + e, "error", true)
              })
          }).catch(e => {
            this.global.showToast("Error occured" + e, "error", true)
          })
      }).catch(e => {
        this.global.showToast("Error occured" + e, "error", true)
      })
  }

  private getCgstAmt(): number {
    return this.salesDetails.filter(d => d.itemName).map(d => d.cgstAmt).reduce((a, b) => a + b, 0)
  }


  private getSgstAmt(): number {
    return this.salesDetails.filter(d => d.itemName).map(d => d.sgstAmt).reduce((a, b) => a + b, 0)
  }

  private getIgstAmt(): number {
    return this.salesDetails.filter(d => d.itemName).map(d => d.igstAmt).reduce((a, b) => a + b, 0)
  }

  private getCessAmt(): number {
    return this.salesDetails.filter(d => d.itemName).map(d => d.cessAmt).reduce((a, b) => a + b, 0)
  }
}

