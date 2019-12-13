/*global location */
sap.ui.define([
	"approve/req/vendor/codan/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"approve/req/vendor/codan/model/formatter",
	"sap/m/MessageBox",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function (BaseController, JSONModel, formatter, MessageBox, Filter, FilterOperator) {
	"use strict";

	return BaseController.extend("approve.req.vendor.codan.controller.Detail", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		onInit: function () {
			// Model used to manipulate control states. The chosen values make sure,
			// detail page is busy indication immediately so there is no break in
			// between the busy indication for loading the view's meta data
			var oViewModel = new JSONModel({
				busy: false,
				delay: 0,
				selectedTab: "tab1",
				editMode: false,
				approvalResult: "",
				decisionText: "",
				approveMode: false,
				financeApproval: false,
				accountingClerk: "",
				paymentTerms: ""
			});

			this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);
			this.getRouter().getRoute("approveObject").attachPatternMatched(this._onApproveObjectMatched, this);

			this.setModel(oViewModel, "detailView");

			this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * Event handler when the share by E-Mail button has been clicked
		 * @public
		 */
		onShareEmailPress: function () {
			var oViewModel = this.getModel("detailView");

			sap.m.URLHelper.triggerEmail(
				null,
				oViewModel.getProperty("/shareSendEmailSubject"),
				oViewModel.getProperty("/shareSendEmailMessage")
			);
		},

		/**
		 * Event handler when the share in JAM button has been clicked
		 * @public
		 */
		onShareInJamPress: function () {
			var oViewModel = this.getModel("detailView"),
				oShareDialog = sap.ui.getCore().createComponent({
					name: "sap.collaboration.components.fiori.sharing.dialog",
					settings: {
						object: {
							id: location.href,
							share: oViewModel.getProperty("/shareOnJamTitle")
						}
					}
				});

			oShareDialog.open();
		},

		navigateToReq: function () {
			var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
			var hash = (oCrossAppNavigator && oCrossAppNavigator.hrefForExternal({
				target: {
					semanticObject: "VendorRequest",
					action: "create"
				}
			})) + "&/requests/" + this._sObjectId + "/" + this.getModel().getProperty(this._sObjectPath + "/companyCode");
			oCrossAppNavigator.toExternal({
				target: {
					shellHash: hash
				}
			});
		},

		onApprove: function () {
			this._showDecisionDialog("A");
		},

		onReject: function () {
			this._showDecisionDialog("R");
		},

		cancelDecisionDialog: function () {
			if (this._oDecisionDialog) {
				if (this._oDecisionDialog.close) {
					this._oDecisionDialog.close();
				}
				this._oDecisionDialog.destroy();
				delete this._oDecisionDialog;
			}
		},

		okDecisionDialog: function () {
			var model = this.getModel(),
				detailModel = this.getModel("detailView"),
				result = detailModel.getProperty("/approvalResult"),
				decisionText = detailModel.getProperty("/decisionText"),
				approvalTypeText = result === 'A' ? "approved" : "rejected";

			if (result !== "A" && !decisionText) {
				MessageBox.alert("msgNoDecisionText");
				return;
			}
			
			if (result === "A") {
				model.setProperty(this._sObjectPath + "/accountingClerk", detailModel.getProperty("/accountingClerk"));
				model.setProperty(this._sObjectPath + "/paymentTerms", detailModel.getProperty("/paymentTerms"));
			}

			// Submit the changes before creating the approval
			var changesUpdated = new Promise(function (res, rej) {
				if (!model.hasPendingChanges()) {
					res();
					return;
				}

				model.submitChanges({
					success: function () {
						res();
						return;
					},
					error: function (err) {
						rej();
					}
				});

			});

			changesUpdated.then(function () {
				model.create("/Approvals", {
					id: this._sObjectId,
					approvalResult: result,
					decisionText: decisionText
				}, {
					success: function () {
						this.cancelDecisionDialog();
						sap.m.MessageToast.show("The request has been successfully " + approvalTypeText, {
							duration: 7000
						});
					}.bind(this)
				});
			}.bind(this));
		},

		/* =========================================================== */
		/* begin: internal methods                                     */
		/* =========================================================== */

		/**
		 * Binds the view to the object path and expands the aggregated line items.
		 * @function
		 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
		 * @private
		 */
		_setupBinding: function (oEvent) {
			this._sObjectId = oEvent.getParameter("arguments").objectId;
			this.getModel().metadataLoaded().then(function () {
				var sObjectPath = this.getModel().createKey("Requests", {
					id: this._sObjectId
				});
				this._bindView("/" + sObjectPath);
			}.bind(this));
		},

		_onObjectMatched: function (oEvent) {
			this.getModel("detailView").setProperty("/approveMode", false);
			this._setupBinding(oEvent);
		},

		_onApproveObjectMatched: function (oEvent) {

			// Retrieve my authorisation level
			var oCommonModel = this.getOwnerComponent().getModel("common"),
				oDetailModel = this.getModel("detailView");

			oCommonModel.metadataLoaded().then(function () {
				oCommonModel.read("/AppAuthorisations(application='VENDOR_REQ')", {
					success: function (data) {
						if (data.authorisation) {
							oDetailModel.setProperty("/approveMode", true);
							oDetailModel.setProperty("/financeApproval", data.authorisation === "FINANCE" || data.authorisation === "ADMIN");

						}
					}
				});
			});

			this._setupBinding(oEvent);

		},

		/**
		 * Binds the view to the object path. Makes sure that detail view displays
		 * a busy indicator while data for the corresponding element binding is loaded.
		 * @function
		 * @param {string} sObjectPath path to the object to be bound to the view.
		 * @private
		 */
		_bindView: function (sObjectPath) {
			// Set busy indicator during view binding
			var oViewModel = this.getModel("detailView");

			// If the view was not bound yet its not busy, only if the binding requests data it is set to busy again
			oViewModel.setProperty("/busy", false);

			this._sObjectPath = sObjectPath;

			this.getView().bindElement({
				path: sObjectPath,
				events: {
					change: this._onBindingChange.bind(this),
					dataRequested: function () {
						oViewModel.setProperty("/busy", true);
					},
					dataReceived: function () {
						oViewModel.setProperty("/busy", false);
					}
				}
			});
		},

		_onBindingChange: function () {
			var oView = this.getView(),
				oElementBinding = oView.getElementBinding();

			// No data for the binding
			if (!oElementBinding.getBoundContext()) {
				this.getRouter().getTargets().display("detailObjectNotFound");
				// if object could not be found, the selection in the master list
				// does not make sense anymore.
				this.getOwnerComponent().oListSelector.clearMasterListSelection();
				return;
			}

			var sPath = oElementBinding.getPath(),
				oResourceBundle = this.getResourceBundle(),
				oObject = oView.getModel().getObject(sPath),
				sObjectId = oObject.id,
				sObjectName = oObject.name1,
				oViewModel = this.getModel("detailView");

			this.getOwnerComponent().oListSelector.selectAListItem(sPath);

			oViewModel.setProperty("/saveAsTileTitle", oResourceBundle.getText("shareSaveTileAppTitle", [sObjectName]));
			oViewModel.setProperty("/shareOnJamTitle", sObjectName);
			oViewModel.setProperty("/shareSendEmailSubject",
				oResourceBundle.getText("shareSendEmailObjectSubject", [sObjectId]));
			oViewModel.setProperty("/shareSendEmailMessage",
				oResourceBundle.getText("shareSendEmailObjectMessage", [sObjectName, sObjectId, location.href]));
		},

		_onMetadataLoaded: function () {
			// Store original busy indicator delay for the detail view
			var iOriginalViewBusyDelay = this.getView().getBusyIndicatorDelay(),
				oViewModel = this.getModel("detailView");

			// Make sure busy indicator is displayed immediately when
			// detail view is displayed for the first time
			oViewModel.setProperty("/delay", 0);

			// Binding the view will set it to not busy - so the view is always busy if it is not bound
			oViewModel.setProperty("/busy", true);
			// Restore original busy indicator delay for the detail view
			oViewModel.setProperty("/delay", iOriginalViewBusyDelay);
		},

		_showDecisionDialog: function (sDecision) {
			var model = this.getModel("detailView");
			model.setProperty("/decisionText", "");
			model.setProperty("/approvalResult", sDecision);
			model.setProperty("/accountingClerk", this.getModel().getProperty(this._sObjectPath + "/accountingClerk"));
			model.setProperty("/paymentTerms", this.getModel().getProperty(this._sObjectPath + "/paymentTerms"));

			if (!this._oDecisionDialog) {
				this._oDecisionDialog = sap.ui.xmlfragment("approve.req.vendor.codan.fragments.DecisionTextDialog", this);
				this.getView().addDependent(this._oDecisionDialog);
			}

			this._oDecisionDialog.open();

			if (sDecision === "A") {
				var oClerk = sap.ui.getCore().byId("accountingClerk");
				if (oClerk) {
					oClerk.getBinding("items").filter(new Filter({
						path: "filterValue",
						operator: FilterOperator.EQ,
						value1: this.getModel().getProperty(this._sObjectPath + "/companyCode")
					}));
				}
			}

		}

	});

});