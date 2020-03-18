sap.ui.define([
	"sap/m/StandardListItem",
	"sap/m/StandardListItemRenderer",
	"approve/req/vendor/codan/control/ListItemWithColorIconRenderer"
], function(SLI, SLIR, LIR) {
	"use strict";
	
	return SLI.extend("approve.req.vendor.codan.control.ListItemWithColorIcon", {
		metadata: {
			properties: {
				"additionalInfo": "string"
			}
		},
		renderer: function(oRm, oControl) {
			LIR.render(oRm, oControl);
		},
		onAfterRendering: function() {
			if (SLI.prototype.onAfterRendering) {
				SLI.prototype.onAfterRendering.apply(this, arguments);
			}
			var that = this;
			this.$().find(".sapUiIcon").each(function() {
				var iconClass = "z" + that.getInfoState() + "Icon";
				$(this).addClass(iconClass);
			});
		}
	});
});