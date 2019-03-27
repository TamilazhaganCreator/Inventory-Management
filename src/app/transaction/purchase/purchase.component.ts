import { MasterService } from './../../master/master.service';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, ElementRef, EventEmitter, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MaterializeAction } from 'angular2-materialize';
import * as html2canvas from 'html2canvas';
import * as jspdf from 'jspdf';
import { Subscription } from 'rxjs';
import { GenericLovService } from 'src/app/genericlov/genericlov.service';
import { GlobalService } from 'src/app/global.service';
import { CustomerModel, ItemModel, TaxModel } from 'src/app/master/master.model';
import { SerialNumbersModel } from '../../global.model';
import { PurchaseDetailModel, PurchaseHeaderModel } from '../transaction.model';
import { TransactionService } from '../transaction.service';

@Component({
  selector: 'app-purchase',
  templateUrl: './purchase.component.html',
  styleUrls: ['../salestransaction/salestransaction.component.css'],
  animations: [
    trigger("rotatedUp", [
      state("default", style({ transform: "rotate(0)" })),
      state("rotated", style({ transform: "rotate(-180deg)" })),
      transition("rotated => default", animate("100ms ease-out")),
      transition("default => rotated", animate("100ms ease-in"))
    ])
  ]
})
export class PurchaseComponent {

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
        this.purchaseHeader.paidAmt = this.purchaseHeader.chqAmt
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
  purchaseHeader = new PurchaseHeaderModel();
  purchaseDetails: PurchaseDetailModel[] = []
  private subscriptions: Subscription[] = []
  confimationModalHeader: string = ""
  chqModalAction = new EventEmitter<string | MaterializeAction>();
  confirmationModal = new EventEmitter<string | MaterializeAction>();
  private serials = new SerialNumbersModel()
  private latestId = 0
  @ViewChildren("itemCodeInputs") private itemCodeInputs: QueryList<any>;
  @ViewChildren("quantityInputs") private quantityInputs: QueryList<any>;
  @ViewChild("clearChqButton") private clearChqButton: ElementRef;
  @ViewChild("saveChqButton") private saveChqButton: ElementRef;
  @ViewChild("invoiceNoInput") private invoiceNoInput: ElementRef;
  @ViewChild("custNameInput") private custNameInput: ElementRef;
  @ViewChild("spInputs") private spInputs: QueryList<any>;
  @ViewChild("otherChargesInput") private otherChargesInput: ElementRef;
  @ViewChild("paidAmtInput") private paidAmtInput: ElementRef;
  private alphaNumericRegex: RegExp = /^[a-zA-Z0-9\._-]*$/
  private tenNumberWithTwoDigitsFormatRegex: RegExp = /^\d{0,10}(?:\.\d{0,2})?$/;
  billShow: boolean = false

  constructor(private lovService: GenericLovService, private global: GlobalService, private service: TransactionService,
    private router: ActivatedRoute, private masterService: MasterService) {
    this.subscriptions[0] = this.lovService.getLovItem()
      .subscribe(res => {
        if (res[1] == "items") {
          var item = res[0] as ItemModel
          this.purchaseDetails[res[2]].itemCode = item.code
          this.purchaseDetails[res[2]].itemName = item.name
          this.purchaseDetails[res[2]].hsncode = item.hsncode
          this.purchaseDetails[res[2]].taxPercentage = item.taxPercentage
          this.purchaseDetails[res[2]].cgst_perc = item.cgst_perc
          this.purchaseDetails[res[2]].sgst_perc = item.sgst_perc
          this.purchaseDetails[res[2]].igst_perc = item.igst_perc
          this.purchaseDetails[res[2]].cess_perc = item.cess_perc
          this.purchaseDetails[res[2]].unitType = item.unitType
          this.purchaseDetails[res[2]].unitName = item.unitName
          this.purchaseDetails[res[2]].stockValue = item.stock
          this.purchaseDetails[res[2]].sales = item.sales
          this.purchaseDetails[res[2]].purchase = item.purchase
          this.purchaseDetails[res[2]].unit = item.unit
          this.purchaseDetails[res[2]].sp = item.sp
          this.setElementFocus(this.quantityInputs, res[2])
        } else if (res[1] == "Supplier") {
          var supplier = res[0] as CustomerModel
          this.purchaseHeader.supplierName = supplier.name
          this.purchaseHeader.supplierAddress = supplier.address
          this.purchaseHeader.supplierGSTNo = supplier.gstNo
          this.purchaseHeader.supplierAmt = supplier.amount
          this.purchaseHeader.supplierCode = supplier.code
          this.purchaseHeader.supplierValid = true
          this.purchaseHeader.supplierLocation = supplier.location
          this.invoiceNoInput.nativeElement.focus();
        } else if (res[1] == "tax") {
          let tax = res[0] as TaxModel
          this.purchaseDetails[res[2]].taxPercentage = tax.cess_perc + tax.cgst_perc + tax.sgst_perc
          this.purchaseDetails[res[2]].cgst_perc = tax.cgst_perc
          this.purchaseDetails[res[2]].sgst_perc = tax.sgst_perc
          this.purchaseDetails[res[2]].igst_perc = tax.igst_perc
          this.purchaseDetails[res[2]].cess_perc = tax.cess_perc
          this.purchaseDetailsCalculation(res[2])
        }
      })
    this.router.queryParams.
      subscribe(params => {
        let id = params['purchaseId']
        if (id) {
          this.global.loader = true
          this.service.getHeaderDetails("purchaseHeader", id)
            .subscribe((res) => {
              this.global.loader = true
              let temHeader = res.data() as PurchaseHeaderModel
              this.masterService.getItem("suppliermaster", temHeader.supplierCode.toString())
                .subscribe((sup) => {
                  let supplier = sup.data() as CustomerModel
                  temHeader.supplierGSTNo = supplier.gstNo
                  temHeader.supplierAmt = supplier.amount
                  this.service.getTransactionDetails("purchaseDetail", id)
                    .then((res) => {
                      this.global.loader = true
                      let index = 0
                      this.purchaseDetails = []
                      res.forEach(doc => {
                        this.purchaseDetails[index] = doc.data() as PurchaseDetailModel
                        index++;
                      })
                      temHeader.invoiceDate = new Date(temHeader.timestamp)
                      this.purchaseHeader = temHeader
                      this.global.loader = false
                      this.global.showToast("Purchase details for that row - [ READ ONLY MODE ]", "success", true)
                    }, error => {
                      this.global.showToast("Error occurred" + error, "error", true)
                    })
                }, error => {
                  this.global.showToast("Error occurred" + error, "error", true)
                })
            }, error => {
              this.global.showToast("Error occurred" + error, "error", true)
            })
        } else {
          this.global.loader = true
          this.getLatestItem()
        }
      });
  }

  resetSales() {
    this.purchaseHeader.supplierValid = false
    this.purchaseHeader = new PurchaseHeaderModel()
    this.purchaseHeader.invoiceDate = new Date()
    this.purchaseHeader.timestamp = new Date().getTime()
    this.purchaseDetails = []
    this.addInitialItem();
  }

  private addInitialItem() {
    this.purchaseDetails.push(new PurchaseDetailModel());
    this.purchaseDetails = [...this.purchaseDetails];
  }

  addRow(event) {
    if (event.keyCode == 43) {
      this.addItem()
    }
  }

  showItemLovModal(event, collection, index) {
    if (event.keyCode == 13) {
      if (this.purchaseHeader.supplierValid) {
        if (this.purchaseHeader.invoiceDate != null) {
          if (this.purchaseHeader.invoiceNo != null && this.purchaseHeader.invoiceNo != "") {
            if (this.purchaseHeader.paymentType != null) {
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
        this.global.showToast("Kindly add the supplier details", "warning", false)
      }
    }
  }

  delete() {
    this.global.loader = true
    this.service.deletePurcahseHeader(this.purchaseHeader)
      .then(res => {
        this.service.deletePurchaseDetail(this.purchaseDetails, this.purchaseHeader.id.toString())
          .then(res => {
            this.service.updateItemDetails(this.getItemArray(false))
              .then(res => {
                if (this.purchaseHeader.paymentType != 1) {
                  let amount = this.removeCustomerAmt()
                  this.service.updateCustomerAmount("suppliermaster", this.purchaseHeader.supplierCode.toString(), amount)
                    .then(res => {
                      this.global.showToast("Sales deleted successfully", "sucess", false)
                    }).catch(e => {
                      this.global.showToast("Error occured" + e, "error", true)
                    })
                } else {
                  this.printBill()
                }
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

  removeCustomerAmt(): number {
    if (this.purchaseHeader.paymentType == 0) {
      return this.purchaseHeader.supplierAmt + this.purchaseHeader.netAmt;
    } else if (this.purchaseHeader.paymentType == 1) {
      let amt = this.purchaseHeader.paidAmt - this.purchaseHeader.netAmt
      return this.purchaseHeader.supplierAmt - amt
    } else if (this.purchaseHeader.paymentType == 2) {
      let amt = this.purchaseHeader.chqAmt - this.purchaseHeader.netAmt
      return this.purchaseHeader.supplierAmt - amt
    }
  }

  showLovModal(event, collection, index) {
    if (event.keyCode == 13) {
      this.lovService.showLovModal(true, collection, "", index)
    }
  }

  removeTax(rowIndex) {
    this.purchaseDetails[rowIndex].taxPercentage = 0
    this.purchaseDetails[rowIndex].cgst_perc = 0
    this.purchaseDetails[rowIndex].sgst_perc = 0
    this.purchaseDetails[rowIndex].igst_perc = 0
    this.purchaseDetails[rowIndex].cess_perc = 0
    this.purchaseDetailsCalculation(rowIndex)
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

  addItem() {
    let index = this.purchaseDetails.length - 1
    if (this.purchaseDetails[index].itemName) {
      if (this.checkRowValid(index, this.purchaseDetails[index].quantity, "quantityInputs") && this.checkRowValid(index, this.purchaseDetails[index].sp, "spInputs")) {
        this.purchaseDetails.push(new PurchaseDetailModel())
        this.setElementFocus(this.itemCodeInputs, this.purchaseDetails.length - 1);
      }
    } else {
      this.setElementFocus(this.itemCodeInputs, this.purchaseDetails.length - 1);
      this.global.showToast("Kindly enter the item details", "warning", false)
    }
  }

  checkField(index: number, event, format: string, field: string) {
    if (this.global[format].test(event.target.value)) {
      if (event.target.value != '')
        this.purchaseDetails[index][field] = +(event.target.value)
      else
        this.purchaseDetails[index][field] = null
      this.purchaseDetailsCalculation(index)
    } else {
      event.target.value = this.purchaseDetails[index][field] ? this.purchaseDetails[index][field] : ''
    }
  }

  purchaseDetailsCalculation(index: number) {
    if (this.purchaseHeader.supplierValid) {
      if (this.purchaseDetails[index].quantity && this.purchaseDetails[index].sp) {
        this.purchaseDetails[index].totalUnit = this.purchaseDetails[index].quantity * this.purchaseDetails[index].unit
        let totalAmt = this.purchaseDetails[index].totalUnit * this.purchaseDetails[index].sp
        this.purchaseDetails[index].cessAmt = totalAmt * ((this.purchaseDetails[index].cess_perc) / 100)
        if (this.purchaseHeader.supplierLocation == 0) {
          this.purchaseDetails[index].sgstAmt = totalAmt * ((this.purchaseDetails[index].cgst_perc) / 100)
          this.purchaseDetails[index].cgstAmt = totalAmt * ((this.purchaseDetails[index].sgst_perc) / 100)
          this.purchaseDetails[index].igstAmt = 0
          this.purchaseDetails[index].netAmt = totalAmt + this.purchaseDetails[index].sgstAmt + this.purchaseDetails[index].cgstAmt + this.purchaseDetails[index].cessAmt
        } else if (this.purchaseHeader.supplierLocation == 1) {
          this.purchaseDetails[index].igstAmt = totalAmt * (this.purchaseDetails[index].taxPercentage / 100)
          this.purchaseDetails[index].cgstAmt = this.purchaseDetails[index].sgstAmt = 0
          this.purchaseDetails[index].netAmt = totalAmt + this.purchaseDetails[index].igstAmt + this.purchaseDetails[index].cessAmt
        }
        this.purchaseHeaderCalculation();
      }
    }
  }

  setInvoiceDate(event) {
    var dateArray = event.target.value.toString().split("/")
    this.purchaseHeader.invoiceDate = new Date(dateArray[2] + "-" + dateArray[1] + "-" + dateArray[0] + " 00:00:00")
    this.purchaseHeader.timestamp = this.purchaseHeader.invoiceDate.getTime()
  }



  purchaseHeaderCalculation() {
    if (this.purchaseHeader.supplierLocation == 0) {
      let cgst = this.purchaseDetails.filter(item => item.cgstAmt != null).map(item => item.cgstAmt).reduce((a, b) => a + b, 0)
      let sgst = this.purchaseDetails.filter(item => item.sgstAmt != null).map(item => item.sgstAmt).reduce((a, b) => a + b, 0)
      let cess = this.purchaseDetails.filter(item => item.cessAmt != null).map(item => item.cessAmt).reduce((a, b) => a + b, 0)
      this.purchaseHeader.taxAmt = cgst + sgst + cess
    } else if (this.purchaseHeader.supplierLocation == 1) {
      let igst = this.purchaseDetails.filter(item => item.igstAmt != null).map(item => item.igstAmt).reduce((a, b) => a + b, 0)
      let cess = this.purchaseDetails.filter(item => item.cessAmt != null).map(item => item.cessAmt).reduce((a, b) => a + b, 0)
      this.purchaseHeader.taxAmt = igst + cess
    }
    this.purchaseHeader.netAmt = this.purchaseDetails.filter(item => item.netAmt != null).map(item => item.netAmt).reduce((a, b) => a + b, 0)
  }

  clearSupplierDetails() {
    this.purchaseHeader.supplierValid = false
    this.purchaseHeader.supplierAmt = null
    this.purchaseHeader.supplierAddress = null
    this.purchaseHeader.supplierGSTNo = null
    this.purchaseHeader.supplierName = null
    this.purchaseHeader.supplierLocation = null
  }

  setPaymentType(event) {
    this.purchaseHeader.paymentType = +(event.target.value)
    if (this.purchaseHeader.paymentType == 2) {
      this.openChqModal()
    } else {
      this.purchaseHeader.chqDate = null
      this.purchaseHeader.chqNo = 0
      this.purchaseHeader.chqAmt = null
      this.purchaseHeader.chqBank = null
      this.purchaseHeader.timestamp = null
      this.purchaseHeader.paidAmt = null
    }
    if (this.purchaseHeader.paymentType == 0) {
      this.purchaseHeader.paidAmt = 0
    } else if (this.purchaseHeader.paymentType == 1) {
      this.purchaseHeader.paidAmt = null
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
        this.purchaseHeader[fieldName] = +(event.target.value)
      else
        this.purchaseHeader[fieldName] = null
    } else {
      event.target.value = this.purchaseHeader[fieldName] ? this.purchaseHeader[fieldName] : ''
    }
  }

  saveChqDetails() {
    if (this.purchaseHeader.chqDate != null && this.purchaseHeader.chqNo != null && this.purchaseHeader.chqAmt
      && (this.purchaseHeader.chqBank != null && this.purchaseHeader.chqBank != "")) {
      this.closeChqModal()
      this.global.showToast("Cheque details are saved successfully", "warning", false)
    } else {
      this.global.showToast("Kindly fill all the details", "warning", false)
    }
  }

  clearChqDetails() {
    this.paymentTypeShow = false
    setTimeout(() => {
      this.paymentTypeShow = true
    }, 100);
    this.purchaseHeader.paymentType = 0
    if (this.purchaseHeader.chqDate != null && this.purchaseHeader.chqNo != null && this.purchaseHeader.chqAmt
      && (this.purchaseHeader.chqBank != null && this.purchaseHeader.chqBank != "")) {
      this.purchaseHeader.chqDate = null
      this.purchaseHeader.chqNo = 0
      this.purchaseHeader.chqAmt = null
      this.purchaseHeader.chqBank = ""
      this.global.showToast("Cheque details are cleared successfully", "warning", false)
    }
  }

  checkInvoiceNo(event) {
    if (this.alphaNumericRegex.test(event.target.value)) {
      this.purchaseHeader.invoiceNo = event.target.value
    } else {
      event.target.value = this.purchaseHeader.invoiceNo
    }
  }

  endProcess() {
    if (this.purchaseHeader.id) {
      this.printBill()
    } else {
      this.submitProcess()
    }
  }

  clearAll() {
    this.global.loader = true
    this.resetSales()
    this.global.loader = false
    this.global.showToast("Cleared Successfully", "warning", false)
  }

  setBankName(event) {
    this.purchaseHeader.chqBank = event.target.value
  }

  clearProcess() {
    this.confimationModalHeader = "Clear all"
    this.openSubmitModal()
  }


  submitProcess() {
    if (this.purchaseHeader.supplierValid) {
      if (this.purchaseHeader.invoiceDate != null) {
        if (this.purchaseHeader.invoiceNo != null && this.purchaseHeader.invoiceNo != "") {
          if (this.purchaseHeader.paymentType != null) {
            if (this.purchaseHeader.otherCharges != null) {
              if (this.purchaseHeader.paidAmt != null) {
                if (this.purchaseDetails.length > 0 && this.purchaseDetails[0].itemName != null && this.purchaseDetails[0].itemName != '') {
                  if (this.purchaseDetails[this.purchaseDetails.length - 1].itemName == null) {
                    this.purchaseDetails.splice(this.purchaseDetails.length - 1, 1)
                  }
                  if (this.fullItemsValid()) {
                    this.purchaseHeader.timestamp = this.purchaseHeader.invoiceDate.getTime()
                    this.confimationModalHeader = "Submit"
                    this.openSubmitModal()
                  }
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
      this.global.showToast("Kindly add the supplier details", "warning", false)
    }
  }

  yesButtonProcess() {
    if (this.confimationModalHeader == "Clear all") {
      this.clearAll()
    } else if (this.confimationModalHeader == "Submit") {
      this.submitToServer()
    }
  }


  submitToServer() {
    this.global.loader = true
    this.purchaseHeader.id = this.latestId
    this.service.addPurchaseHeader(this.purchaseHeader)
      .then(res => {
        this.service.addPurchaseDetail(this.purchaseDetails, this.purchaseHeader.id.toString())
          .then(res => {
            this.service.updateItemDetails(this.getItemArray(true))
              .then(res => {
                if (this.purchaseHeader.paymentType != 1) {
                  let amount = this.getsupplierAmt()
                  this.service.updateCustomerAmount("suppliermaster", this.purchaseHeader.supplierCode.toString(), amount)
                    .then(res => {
                      this.printBill();
                    }).catch(e => {
                      this.global.showToast("Error occured" + e, "error", true)
                    })
                } else {
                  this.printBill()
                }
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
    this.global.getLatestSerial().subscribe(res => {
      if (res.docs.length > 0) {
        this.serials = res.docs[0].data() as SerialNumbersModel
        this.latestId = this.serials.purchaseHeader + 1
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
    this.purchaseDetails.splice(rowIndex, 1)
    this.global.showToast("Deleted an item", "success", false)
    if (this.purchaseDetails.length == 0) {
      this.addInitialItem()
    }
    this.purchaseHeaderCalculation()
  }

  updateSerials() {
    this.serials.purchaseHeader = this.serials.purchaseHeader + 1
    this.global.updateLatestSerial(this.serials)
      .then(res => {
        this.latestId++;
        this.resetSales()
        this.global.loader = false
        this.global.showToast("Saved successfully", "success", false)
      }).catch(e => { this.global.showToast("Error occured" + e, "error", true) })
  }

  getsupplierAmt(): number {
    if (this.purchaseHeader.paymentType == 0) {
      return this.purchaseHeader.supplierAmt - this.purchaseHeader.netAmt;
    } else if (this.purchaseHeader.paymentType == 1) {
      let amt = this.purchaseHeader.paidAmt - this.purchaseHeader.netAmt
      return this.purchaseHeader.supplierAmt + amt
    } else if (this.purchaseHeader.paymentType == 2) {
      let amt = this.purchaseHeader.chqAmt - this.purchaseHeader.netAmt
      return this.purchaseHeader.supplierAmt + amt
    }
  }

  getItemArray(add: boolean): ItemModel[] {
    let items: ItemModel[] = []
    let index = 0
    this.purchaseDetails.forEach((element) => {
      items[index] = new ItemModel()
      items[index].code = this.purchaseDetails[index].itemCode
      items[index].unit = this.purchaseDetails[index].unit
      items[index].unitName = this.purchaseDetails[index].unitName
      items[index].unitType = this.purchaseDetails[index].unitType
      if (add) {
        items[index].stock = this.purchaseDetails[index].stockValue + this.purchaseDetails[index].quantity
        items[index].purchase = this.purchaseDetails[index].purchase + this.purchaseDetails[index].quantity
      } else {
        items[index].stock = this.purchaseDetails[index].stockValue - this.purchaseDetails[index].quantity
        items[index].purchase = this.purchaseDetails[index].purchase - this.purchaseDetails[index].quantity
      }
      items[index].cgst_perc = this.purchaseDetails[index].cgst_perc
      items[index].sgst_perc = this.purchaseDetails[index].sgst_perc
      items[index].igst_perc = this.purchaseDetails[index].igst_perc
      items[index].cess_perc = this.purchaseDetails[index].cess_perc
      items[index].hsncode = this.purchaseDetails[index].hsncode
      items[index].taxPercentage = this.purchaseDetails[index].taxPercentage
      items[index].sales = this.purchaseDetails[index].sales
      index++;
    })
    return items
  }

  checkRowValid(index, value, field): boolean {
    if (this.purchaseDetails[index].itemName) {
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
    for (let index = 0; index < this.purchaseDetails.length; index++) {
      if (!this.checkRowValid(index, this.purchaseDetails[index].quantity, "quantityInputs") || !this.checkRowValid(index, this.purchaseDetails[index].sp, "spInputs")) {
        return false
      }
    }
    return true
  }

  setPaidAmt(event) {
    if (this.tenNumberWithTwoDigitsFormatRegex.test(event.target.value)) {
      if (event.target.value != '') {
        this.purchaseHeader.paidAmt = +(event.target.value)
      } else
        this.purchaseHeader.paidAmt = null
    } else {
      event.target.value = this.purchaseHeader.paidAmt ? this.purchaseHeader.paidAmt : ''
    }
  }

  checkValue(field: string, event, index) {
    if (this.purchaseDetails[index].itemName) {
      if (event.target.value == '' || event.target.value == null || event.target.value == 0) {
        this.setElementFocus(this[field], index)
        this.global.showToast("Kindly enter the " + field.replace("Inputs", "") + " value", "warning", false)
      }
    }
  }

  public printBill() {
    this.global.loader = true
    this.billShow = true
    setTimeout(() => {
      var data = document.getElementById('bill');
      html2canvas(data).then(canvas => {
        // Few necessary setting options
        const contentDataURL = canvas.toDataURL('image/png')
        let pdf = new jspdf('p', 'mm', 'a4'); // A4 size page of PDF
        pdf.addImage(contentDataURL, 'PNG', 0, 0)
        let date = this.purchaseHeader.invoiceDate.getDate() + "/" + (this.purchaseHeader.invoiceDate.getMonth() + 1) + "/" + this.purchaseHeader.invoiceDate.getFullYear()
        pdf.save("PURCHASE - " + this.purchaseHeader.supplierName + "- Invoice_No_" + this.purchaseHeader.invoiceNo + " - [ " + date + " ]" + '.pdf', { returnPromise: true }).then(result => {
          this.billShow = false
          this.updateSerials();
        })
      });
    }, 100);
  }

  private getCgstAmt(): number {
    return this.purchaseDetails.filter(d => d.itemName).map(d => d.cgstAmt).reduce((a, b) => a + b, 0)
  }


  private getSgstAmt(): number {
    return this.purchaseDetails.filter(d => d.itemName).map(d => d.sgstAmt).reduce((a, b) => a + b, 0)
  }

  private getIgstAmt(): number {
    return this.purchaseDetails.filter(d => d.itemName).map(d => d.igstAmt).reduce((a, b) => a + b, 0)
  }

  private getCessAmt(): number {
    return this.purchaseDetails.filter(d => d.itemName).map(d => d.cessAmt).reduce((a, b) => a + b, 0)
  }
}

