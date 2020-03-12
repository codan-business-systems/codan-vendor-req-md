sap.ui.define([
	"sap/ui/core/format/FileSizeFormat",
	"sap/ui/core/ValueState"
], function (FSFormat, ValueState) {
	"use strict";

	return {
		/**
		 * Rounds the currency value to 2 digits
		 *
		 * @public
		 * @param {string} sValue value to be formatted
		 * @returns {string} formatted currency value with 2 digits
		 */
		currencyValue: function (sValue) {
			if (!sValue) {
				return "";
			}

			return parseFloat(sValue).toFixed(2);
		},

		formatAttachmentSize: function (f) {
			var a = FSFormat.getInstance();
			return a.format(Number(f));
		},

		formatApprovalIcon: function (approvalResult) {
			switch (approvalResult) {
			case "A":
				return "sap-icon://employee-approvals";
			case "R":
				return "sap-icon://employee-rejections";
			default:
				return "sap-icon://person-placeholder";
			}
		},

		formatBankDetailsIcon: function (bankVerifiedWith, newBankNumber) {
			if (newBankNumber) {
				return "sap-icon://message-warning";
			}

			return bankVerifiedWith ? "sap-icon://sys-enter" : "sap-icon://cancel";

		},

		formatBankDetailsInfoState: function (bankVerifiedWith, newBankNumber) {
			if (newBankNumber) {
				return ValueState.Warning;
			}

			return bankVerifiedWith ? ValueState.Success : ValueState.Error;

		},

		formatBankDetailsDescription: function (bankVerifiedWith, newBankNumber) {
			var result = bankVerifiedWith ? "Entered and Verified With: " + bankVerifiedWith : "Not Provided";

			if (newBankNumber) {
				result = "[Bank Key does not exist in SAP] - " + result;
			}

			return result;

		},

		formatPaymentTermsMessage: function (paymentTerms, paymentTermsText, paymentTermsChanged) {
			if (!paymentTermsChanged) {
				return "No change requested";
			}
			switch (paymentTerms) {
			case "":
				return "No payment terms specified";
			case "Z008":
				return "Standard payment terms selected";
			default:
				return "Non-standard payment terms selected: " + paymentTerms + " (" + paymentTermsText + ")";
			}
		},

		formatPaymentTermsIcon: function (paymentTerms, paymentTermsChanged) {

			if (!paymentTermsChanged) {
				return "sap-icon://cancel";
			}
			switch (paymentTerms) {
			case "":
				return "sap-icon://cancel";
			case "Z008":
				return "sap-icon://sys-enter";
			default:
				return "sap-icon://message-warning";
			}
		},

		formatPaymentTermsInfoState: function (paymentTerms, paymentTermsChanged) {
			if (!paymentTermsChanged) {
				return ValueState.None;
			}
			switch (paymentTerms) {
			case "":
				return ValueState.None;
			case "Z008":
				return ValueState.Success;
			default:
				return ValueState.Warning;
			}
		},

		yesNoResponseRequired: function (sResponseType) {
			return sResponseType.indexOf("Y") > -1 && sResponseType.indexOf("N") > -1;
		},

		questionMandatory: function (sStatus) {
			return sStatus === "M";
		},

		responseTextVisible: function (sResponseType) {
			return sResponseType.indexOf("T") > -1;
		},

		responseTextEnabled: function (sResponseType, sYesNo) {
			switch (sResponseType) {
			case "TXT":
				return true;
			case "YNT":
				return sYesNo === "X";
			case "NYT":
				return sYesNo === "-";
			default:
				return false;
			}
		},

		yesNoSelectedIndex: function (sYesNo) {
			if (!sYesNo) {
				return -1;
			}
			return sYesNo === "X" ? 1 : 0;
		},

		checkBoxSelected: function (sYesNo) {
			return sYesNo === "X";
		},
	};

});