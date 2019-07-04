jQuery.sap.require("sap.ui.qunit.qunit-css");
jQuery.sap.require("sap.ui.thirdparty.qunit");
jQuery.sap.require("sap.ui.qunit.qunit-junit");
QUnit.config.autostart = false;

sap.ui.require([
	"sap/ui/test/Opa5",
	"approve/req/vendor/codan/test/integration/pages/Common",
	"sap/ui/test/opaQunit",
	"approve/req/vendor/codan/test/integration/pages/App",
	"approve/req/vendor/codan/test/integration/pages/Browser",
	"approve/req/vendor/codan/test/integration/pages/Master",
	"approve/req/vendor/codan/test/integration/pages/Detail",
	"approve/req/vendor/codan/test/integration/pages/NotFound"
], function (Opa5, Common) {
	"use strict";
	Opa5.extendConfig({
		arrangements: new Common(),
		viewNamespace: "approve.req.vendor.codan.view."
	});

	sap.ui.require([
		"approve/req/vendor/codan/test/integration/NavigationJourneyPhone",
		"approve/req/vendor/codan/test/integration/NotFoundJourneyPhone",
		"approve/req/vendor/codan/test/integration/BusyJourneyPhone"
	], function () {
		QUnit.start();
	});
});