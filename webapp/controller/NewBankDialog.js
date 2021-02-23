sap.ui.define([
	"sap/ui/base/ManagedObject",
	"sap/ui/core/ValueState"
], function (ManagedObject, ValueState) {
	"use strict";

	return ManagedObject.extend("factsheet.vendor.codan.controller.NewBankDialog", {

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
		_sCountryKey: "",

		open: function (view, model, countryKey) {

			if (!this._oDialog) {
				this._oDialog = sap.ui.xmlfragment("factsheet.vendor.codan.view.dialog.NewBankDialog", this);
				view.addDependent(this._oDialog);
			}

			this._bDialogOk = false;
			this.setRegionFilter(sap.ui.getCore().byId("newBankRegion"), model.getProperty(countryKey));
			this._sCountryKey = countryKey;
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
				this.fireClosed({
					dialogOk: true
				});
				this._oDialog.close();
			}
		},

		validateNewBankDialog: function () {
			var bankNameCtrl = sap.ui.getCore().byId("newBankName"),
				bankSwiftCtrl = sap.ui.getCore().byId("newBankSwift"),
				bankName = bankNameCtrl.getValue(),
				bankSwift = bankSwiftCtrl.getValue();

			bankNameCtrl.setValueState(bankName ? ValueState.None : ValueState.Error);
			bankNameCtrl.setValueStateText(bankName ? "" : "Bank Name is required");
			bankSwiftCtrl.setValueState(bankSwift || this._sCountryKey === "AU" ? ValueState.None : ValueState.Error);
			bankSwiftCtrl.setValueStateText(bankSwift ? "" : "Swift Code is required");

			return !!(bankName && (bankSwift || this._sCountryKey === "AU"));

		}
	});
});