jQuery.sap.require("sap.ui.qunit.qunit-css");
jQuery.sap.require("sap.ui.thirdparty.qunit");
jQuery.sap.require("sap.ui.qunit.qunit-junit");
QUnit.config.autostart = false;

// We cannot provide stable mock data out of the template.
// If you introduce mock data, by adding .json files in your webapp/localService/mockdata folder you have to provide the following minimum data:
// * At least 3 Requests in the list

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
		"approve/req/vendor/codan/test/integration/MasterJourney",
		"approve/req/vendor/codan/test/integration/NavigationJourney",
		"approve/req/vendor/codan/test/integration/NotFoundJourney",
		"approve/req/vendor/codan/test/integration/BusyJourney",
		"approve/req/vendor/codan/test/integration/FLPIntegrationJourney"
	], function () {
		QUnit.start();
	});
});