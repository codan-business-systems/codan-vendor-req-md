sap.ui.define([
	"sap/ca/ui/model/format/FileSizeFormat"
	], function (FSFormat) {
		"use strict";

		return {
			/**
			 * Rounds the currency value to 2 digits
			 *
			 * @public
			 * @param {string} sValue value to be formatted
			 * @returns {string} formatted currency value with 2 digits
			 */
			currencyValue : function (sValue) {
				if (!sValue) {
					return "";
				}

				return parseFloat(sValue).toFixed(2);
			},
			
			formatAttachmentSize:function(f){
				var a=FSFormat.getInstance();
				return a.format(f);
			},
			
			formatApprovalIcon: function(approvalResult) {
				switch (approvalResult) {
					case "A":
						return "sap-icon://employee-approvals";
					case "R":
						return "sap-icon://employee-rejections";
					default:
						return "sap-icon://person-placeholder";
				}
			}
		};

	}
);