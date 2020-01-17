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
			return a.format(f);
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

			return bankVerifiedWith ? "sap-icon://sys-enter" : "sap-icon://sys-cancel";

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

		yesNoResponseRequired: function (sResponseType) {
			return sResponseType.indexOf("YN") > -1;
		},

		questionMandatory: function (sStatus) {
			return sStatus === "M";
		},

		responseTextVisible: function (sResponseType) {
			return sResponseType.indexOf("T") > -1;
		},

		responseTextEnabled: function (sResponseType, sYesNo) {
			return sResponseType === "TXT" || sResponseType.indexOf("T") > -1 && sYesNo === "X";
		},

		yesNoSelectedIndex: function (sYesNo) {
			if (!sYesNo) {
				return -1;
			}
			return sYesNo === "X" ? 1 : 0;
		}
	};

});