/*global location */
sap.ui.define([
	"approve/req/vendor/codan/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"approve/req/vendor/codan/model/formatter",
	"sap/m/MessageBox",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/core/ValueState",
	"sap/m/MessageToast"
], function (BaseController, JSONModel, formatter, MessageBox, Filter, FilterOperator, ValueState, MessageToast) {
	"use strict";

	return BaseController.extend("approve.req.vendor.codan.controller.Detail", {

		formatter: formatter,

		_authLevelLoaded: {}, //Promise to determine if the user's auth level has been loaded.

		_oQuestionExplainTextPopover: {},

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
				errorsMode: false,
				financeApproval: false,
				accountingClerk: "",
				paymentTerms: "",
				searchTerm: "",
				orgAssignments: [
					/*
						{
							id						: string,
							companyCode 			: string,
							companyCodeText 		: string,
							companyEditable			: boolean,
							companyActive			: boolean,
							purchOrg				: string,
							purchOrgText			: string,
							purchOrgEditable		: boolean,
							purchOrgActive			: boolean,
							companyMessage			: string,
							purchOrgMessage			: string,
							originalCompanyActive	: boolean,
							originalPurchOrgActive	: boolean
						}
					*/
				],
				questions: [],
				allQuestions: [],
				approvalPhase: "CREATE",
				authLevel: "CREATE",
				me: "" //My SAP user ID
			});

			this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);
			this.getRouter().getRoute("approveObject").attachPatternMatched(this._onApproveObjectMatched, this);
			this.getRouter().getRoute("errorsObject").attachPatternMatched(this._onErrorsObjectMatched, this);

			this.setModel(oViewModel, "detailView");

			this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));

			var oCommonModel = this.getOwnerComponent().getModel("common");

			this._myUserIdLoaded = new Promise(function (res, rej) {
				oCommonModel.metadataLoaded().then(function () {
					oCommonModel.read("/EnvironmentInfos", {
						success: function (data) {
							oViewModel.setProperty("/me", data.results[0].userId);
							res();
						},
						error: function (err) {
							rej();
						}
					});
				});
			});

			this._oQuestionExplainTextPopover = sap.ui.xmlfragment("approve.req.vendor.codan.fragments.QuestionExplainTextPopover", this);
			this.getView().addDependent(this._oQuestionExplainTextPopover);
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

			sap.m.URLHelper.redirect(window.location.href.split('#')[0] + hash, true);
		},

		onApprove: function () {

			if (this.getModel("detailView").getProperty("/errorsMode")) {
				this.resubmitRequest();
				return;
			}

			// Check if we need to show the questionnaire dialog
			var questionnaireComplete = this._checkForQuestionsAndDisplayDialog(),
				that = this;

			questionnaireComplete.then(function () {
				that._showDecisionDialog("A");
			});

		},

		onReject: function () {
			if (this.getModel("detailView").getProperty("/errorsMode")) {
				this.deleteRequest();
				return;
			}

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
				approvalTypeText = result === "A" ? "approved" : "rejected";
				
			if (result === "A" && detailModel.getProperty("/financeApproval") && !detailModel.getProperty("/searchTerm")) {
				var searchTerm = sap.ui.getCore().byId("searchTerm");
				searchTerm.setValueState(ValueState.Error);
				return;
			}

			if (result !== "A" && !decisionText) {
				MessageBox.alert("msgNoDecisionText");
				return;
			}

			if (result === "A") {
				model.setProperty(this._sObjectPath + "/accountingClerk", detailModel.getProperty("/accountingClerk"));
				model.setProperty(this._sObjectPath + "/paymentTerms", detailModel.getProperty("/paymentTerms"));
				model.setProperty(this._sObjectPath + "/searchTerm", detailModel.getProperty("/searchTerm"));
			}

			// Check for changes to the Org Assignments and push them back into the model
			var orgAssignmentChanges = detailModel.getProperty("/orgAssignments").filter(function (o) {
				return o.originalCompanyActive !== o.companyActive || o.originalPurchOrgActive !== o.purchOrgActive;
			});

			orgAssignmentChanges.forEach(function (o) {
				var key = model.createKey("/OrgAssignments", {
					id: o.id,
					companyCode: o.companyCode
				});

				model.setProperty(key + "/companyActive", o.companyActive);
				model.setProperty(key + "/purchOrgActive", o.purchOrgActive);
			});

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
				
				model.setProperty(this._sObjectPath + "/status", result);
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

				this._setApprovalPhase();
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

			this._authLevelLoaded = Promise.all([oCommonModel.metadataLoaded(),
				this._myUserIdLoaded,
				new Promise(function (res, rej) {
					oCommonModel.read("/AppAuthorisations(application='VENDOR_REQ')", {
						success: function (data) {
							if (data.authorisation !== "CREATE") {
								oDetailModel.setProperty("/approveMode", true);
								oDetailModel.setProperty("/financeApproval", data.authorisation === "AP" || data.authorisation === "ADMIN");
							}
							oDetailModel.setProperty("/authLevel", data.authorisation);
							res();
						},
						error: rej
					});
				})
			]);

			this._setupBinding(oEvent);

		},

		_onErrorsObjectMatched: function (oEvent) {
			this._onApproveObjectMatched(oEvent);
			this.getModel("detailView").setProperty("/errorsMode", true);
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
				parameters: {
					expand: "ToApprovals,ToQuestions"
				},
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

		_calculateOrgAssignmentMessages: function (o, compCode) {

			var requestorCompCode = compCode || this.getModel().getProperty(this._sObjectPath + "/companyCode");

			if (!o.companyEditable) {
				o.companyMessage = "Already extended";
			} else if (o.companyActive) {
				if (requestorCompCode === o.companyCode) {
					o.companyMessage = "Requestor's Company Code";
				} else {
					o.companyMessage = "Will be extended";
				}
			} else {
				o.companyMessage = "";
			}

			if (!o.purchOrgEditable) {
				o.purchOrgMessage = "Already extended";
			} else if (o.purchOrgActive) {
				o.purchOrgMessage = "Will be extended";
			} else {
				o.purchOrgMessage = "";
			}
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
				oViewModel = this.getModel("detailView"),
				oModel = this.getModel(),
				that = this;

			this.getOwnerComponent().oListSelector.selectAListItem(sPath);

			// Read the vendor assignments into the local model
			this.getModel().read(this._sObjectPath + "/ToOrgAssignments", {
				success: function (data) {

					var orgAssignments = data.results.map(function (o) {
						var requestorCompCode = oModel.getProperty(that._sObjectPath + "/companyCode");
						var result = {
							id: o.id,
							companyCode: o.companyCode,
							companyCodeText: o.companyCodeText,
							companyActive: o.companyActive,
							companyEditable: o.companyStatus !== "X",
							purchOrg: o.purchOrg,
							purchOrgText: o.purchOrgText,
							purchOrgActive: o.purchOrgActive,
							purchOrgEditable: o.purchOrgStatus !== "X",
							originalCompanyActive: o.companyActive,
							originalPurchOrgActive: o.purchOrgActive
						};

						that._calculateOrgAssignmentMessages(result, requestorCompCode);

						return result;
					});

					oViewModel.setProperty("/orgAssignments", orgAssignments);
				}
			});

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
			model.setProperty("/searchTerm", this.getModel().getProperty(this._sObjectPath + "/searchTerm"));

			if (!this._oDecisionDialog) {
				this._oDecisionDialog = sap.ui.xmlfragment("approve.req.vendor.codan.fragments.DecisionTextDialog", this);
				this.getView().addDependent(this._oDecisionDialog);
			}

			this._oDecisionDialog.open();

			sap.ui.getCore().byId("searchTerm").setValueState(ValueState.None);

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

		},

		_setApprovalPhase: function () {

			var model = this.getModel(),
				detailModel = this.getModel("detailView"),
				me = detailModel.getProperty("/me"),
				approveMode = detailModel.getProperty("/approveMode"),
				authLevel = "",
				questionList = this.getView().byId("questionListMD"),
				that = this;

			// If I'm the creator of the requisition, the approval phase is always CREATE
			this._authLevelLoaded.then(function () {
				authLevel = detailModel.getProperty("/authLevel");
				if (authLevel !== "ADMIN") {
					if (!detailModel.getProperty("/approveMode") || model.getProperty(that._sObjectPath + "/createdBy") === me) {
						authLevel = "CREATE";
					}
				}

				detailModel.setProperty("/approvalPhase", authLevel);

				if (questionList) {
					questionList.getBinding("items").filter([]);
					questionList.getBinding("items").refresh();
					questionList.getBinding("items").filter(new Filter({
						path: "role",
						operator: approveMode ? "NE" : "EQ",
						value1: authLevel
					}));
				}
			});
		},

		companyCodeSelected: function (oEvent) {
			this._calculateOrgAssignmentMessages(oEvent.getSource().getBindingContext("detailView").getObject());
		},

		_checkForQuestionsAndDisplayDialog: function () {
			var questions = [],
				that = this,
				model = this.getModel(),
				detailModel = this.getModel("detailView"),
				modelQuestions = model.getProperty(this._sObjectPath + "/ToQuestions").map(function (q) {
					return model.getProperty("/" + q);
				});

			return new Promise(function (res, rej) {
				modelQuestions = modelQuestions.filter(function (q) {
					return q.status && q.role !== "CREATE";
				});
				questions = modelQuestions.map(function (q) {
					return Object.assign({
						visible: !q.parentQuestion
					}, q);
				});

				detailModel.setProperty("/questions", questions);

				if (questions.length === 0) {
					res();
					return;
				}

				that._showQuestionsDialog(res, rej);
			});

		},

		_showQuestionsDialog: function (onSuccess, onCancel) {

			if (!this._oQuestionDialog) {
				this._oQuestionDialog = sap.ui.xmlfragment("approve.req.vendor.codan.fragments.Questionnaire", this);
				this.getView().addDependent(this._oQuestionDialog);
			}

			this._oQuestionDialog.attachAfterClose(function (event) {
				if (event.getParameter("origin").getText() === "OK") {
					onSuccess();
				} else {
					onCancel();
				}
			}, this);

			this._oQuestionDialog.open();
		},

		questionnaireOk: function (event) {
			if (this.validateQuestionnaire()) {
				this.closeQuestionnaireDialog(true);
			}
		},

		validateQuestionnaire: function (event) {
			var list = sap.ui.getCore().byId("questionList"),
				listItems = list.getItems(),
				result = true,
				that = this;

			listItems.forEach(function (l) {

				var q = l.getBindingContext("detailView").getObject(),
					rbg = "",

					findInput = function (i) {
						if (i.getValueState && i.getVisible && i.getVisible()) {
							rbg = i;
							return true;
						}

						return i.getItems && i.getItems().find(findInput);
					},

					// Find the radio button group or checkbox 
					txt = l.getContent()[2];

				if (l.getContent().find(findInput)) {
					rbg.setValueState(ValueState.None);
				}

				if (txt) {
					txt.setValueState(ValueState.None);
				}

				if (that.formatter.questionMandatory(q.status)) {
					if (!q.yesNo && (that.formatter.yesNoResponseRequired(q.responseType) || q.responseType === "CHK")) {
						rbg.setValueState(ValueState.Error);
						result = false;
					}

					if (q.responseType === "TXT" && !q.responseText) {
						txt.setValueState(ValueState.Error);
						txt.setValueStateText("Response required");
						result = false;
					}

				}

				if (formatter.responseTextEnabled(q.responseType, q.yesNo) && !q.responseText) {
					txt.setValueState(ValueState.Error);
					txt.setValueStateText("Response required");
					result = false;
				}
			});

			return result;
		},

		closeQuestionnaireDialog: function (bSilent) {
			if (this._oQuestionDialog) {
				this._oQuestionDialog.close();
			}

			if (!bSilent || typeof bSilent !== "boolean") {
				MessageToast.show("Submission Cancelled", {
					duration: 5000
				});
			}
		},

		questionnaireSelectionChange: function (event) {
			var sourcePath = event.getSource().getBindingContext("detailView").getPath(),
				sourceQuestion = event.getSource().getBindingContext("detailView").getObject(),
				newValue = event.getParameter("selectedIndex") === 1 ? "X" : "-",
				model = this.getModel("detailView");

			model.setProperty(sourcePath + "/yesNo", newValue);
			if (event.getParameter("selectedIndex") !== 1) {
				model.setProperty(sourcePath + "/responseText", "");
			}
			event.getSource().setValueState(ValueState.None);

			// Check if any questions have this question as their parent
			var children = model.getProperty("/questions").filter(function (o) {
				return o.parentQuestion === sourceQuestion.questionId;
			});

			if (children.length > 0) {
				children.forEach(function (o) {
					o.visible = o.status && o.parentQuestionResponse === newValue;
				});

				sap.ui.getCore().byId("questionList").getBinding("items").refresh(true);
			}
		},

		deleteAttachment: function (oEvent) {
			this.getModel().remove("/Attachments('" + oEvent.getParameter("documentId") + "')", {
				success: function (data) {
					sap.m.MessageToast.show(this.getResourceBundle().getText("msgAttachmentDeleted"), {
						duration: 5000
					});
				}.bind(this)
			});
		},

		showExplainText: function (event) {
			this._oQuestionExplainTextPopover.bindElement(event.getSource().getBindingContext().getPath());
			this._oQuestionExplainTextPopover.openBy(event.getSource());
		},

		questionnaireCheckBoxSelectionChange: function (event) {
			this.getModel("detailView").setProperty(event.getSource().getBindingContext("detailView").getPath() + "/yesNo", event.getParameter(
				"selected") ? "X" : " ");
			event.getSource().setValueState(ValueState.None);
		},

		resubmitRequest: function () {

			this.getModel().callFunction("/ResubmitRequest", {
				urlParameters: {
					"id": this.getModel().getProperty(this._sObjectPath + "/id")
				},
				success: function () {
					MessageToast.show("Request resubmitted", {
						duration: 8000
					});

				}
			});

		},

		deleteRequest: function () {
			
			var that = this;

			MessageBox.confirm("Are you sure you want to delete the request?", {
				title: "Data loss confirmation",
				onClose: function (sAction) {
					var oModel = that.getModel();

					oModel.setProperty(that._sObjectPath + "/deleted", true);

					oModel.submitChanges({
						success: function () {
							MessageToast.show("Request deleted", {
								duration: 8000
							});

						}
					});
				}
			});

		}

	});

});