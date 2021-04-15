sap.ui.define([
	"sap/ui/base/ManagedObject",
	"sap/ui/core/ValueState"
], function (ManagedObject, ValueState) {
	"use strict";

	return ManagedObject.extend("approve.req.vendor.codan.controller.NewBankDialog", {

		metadata: {
			events: {
				closed: {
					parameters: {
						dialogOk: {
							type: "boolean"
						}
					}
				}
			}
		},

		_oDialog: undefined,
		_bDialogOk: false,
		_oModel: undefined,
		_sCountryKey: "",
		_sBindingPath: "",

		open: function (view, model, bindingPath) {

			if (!this._oDialog) {
				this._oDialog = sap.ui.xmlfragment("approve.req.vendor.codan.fragments.NewBankDialog", this);
				view.addDependent(this._oDialog);
			}
			
			this._oDialog.bindElement(bindingPath);

			this._bDialogOk = false;
			this._sCountryKey = model.getProperty(bindingPath + "/accountCountry");
			this._sBindingPath = bindingPath;
			this._oModel = model;
			this.setRegionFilter(sap.ui.getCore().byId("newBankRegion"), this._sCountryKey);
			this._oDialog.open();
		},

		/**
		 * Ensures the region filter on the specified control is set based on the selected Country key
		 * @param {Object} oControl control to change the binding on
		 * @param {string} sCountryKey Key of the country selected
		 * @public
		 */
		setRegionFilter: function (oControl, sCountryKey) {

			if (!oControl) {
				return;
			}

			var oBinding = oControl.getBinding("items");

			if (!oBinding) {
				return;
			}

			var aFilters = [];
			// Always start with a blank value
			aFilters.push(new sap.ui.model.Filter("country", sap.ui.model.FilterOperator.EQ, ""));

			// If a country key is passed, add that as well
			if (sCountryKey && sCountryKey !== "") {
				aFilters.push(new sap.ui.model.Filter("country", sap.ui.model.FilterOperator.EQ, sCountryKey));
			}

			oBinding.filter(new sap.ui.model.Filter({
				filters: aFilters,
				and: false
			}));

		},

		newBankDialogCancel: function () {
			this.fireClosed({
				dialogOk: false
			});
			this._oDialog.close();
		},

		newBankDialogOk: function () {
			if (this.validateNewBankDialog()) {
				this._bDialogOk = true;
				
				this.updateFields();
				this.fireClosed({
					dialogOk: true
				});
				this._oDialog.close();
			}
		},
		
		updateFields: function() {
			//For some reason that I can't figure out binding is not working on this dialog
			//Instead we'll update the fields manually
			var aInputFields = [
				{
					controlId: "newBankName",
					targetProperty: "bankName"
				},
				{
					controlId: "newBranchName",
					targetProperty: "bankBranch"
				},
				{
					controlId: "newBankSwift",
					targetProperty: "bankSwiftCode"
				},
				{
					controlId: "newBankStreet",
					targetProperty: "bankStreet"
				},
				{
					controlId: "newBankCity",
					targetProperty: "bankCity"
				}
			],
			that = this;
			
			aInputFields.forEach(function(i) {
				that._oModel.setProperty(that._sBindingPath + "/" + i.targetProperty, sap.ui.getCore().byId(i.controlId).getValue());
			});
			
			this._oModel.setProperty(that._sBindingPath + "/bankRegion", sap.ui.getCore().byId("newBankRegion").getSelectedKey());
				
		},

		validateNewBankDialog: function () {
			var bankNameCtrl = sap.ui.getCore().byId("newBankName"),
				bankSwiftCtrl = sap.ui.getCore().byId("newBankSwift"),
				bankKeyCtrl = sap.ui.getCore().byId("newBankKey"),
				bankName = bankNameCtrl.getValue(),
				bankSwift = bankSwiftCtrl.getValue(),
				bankKey = bankKeyCtrl.getValue();

			bankNameCtrl.setValueState(bankName ? ValueState.None : ValueState.Error);
			bankNameCtrl.setValueStateText(bankName ? "" : "Bank Name is required");
			bankSwiftCtrl.setValueState(bankSwift || this._sCountryKey === "AU" || this._sCountryKey === "CA" ? ValueState.None : ValueState.Error);
			bankSwiftCtrl.setValueStateText(bankSwift ? "" : "Swift Code is required");
			bankKeyCtrl.setValueState(bankKey ? ValueState.None : ValueState.Error);
			bankKeyCtrl.setValueStateText(bankKey ? "" : "Bank Key is required");

			return !!(bankName && bankKey && (bankSwift || this._sCountryKey === "AU" || this._sCountryKey === "CA"));

		}
	});
});