sap.ui.define([
		"sap/ui/core/mvc/Controller",
		"sap/m/MessageBox",
		"./utilities",
		"sap/ui/core/routing/History",
		"sap/ui/model/Filter",
		"sap/ui/model/FilterOperator",
		"sap/m/MessageToast",
		"sap/ui/core/message/Message",
		"sap/ui/core/library",
		"sap/ui/model/json/JSONModel",
		"sap/ui/model/BindingMode"

	], function (BaseController, MessageBox, Utilities, History, Filter, FilterOperator, MessageToast, Message, library, JSONModel,
		BindingMode) {
		"use strict";
		// shortcut for sap.ui.core.ValueState
		// shortcut for sap.ui.core.MessageType
		var MessageType = library.MessageType;
		return BaseController.extend("SAPUI5MyReturnOrder.CustomerReturnApproval.controller.ReturnOrderItems", {
			onInit: function () {
				this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
				this.oRouter.getTarget("TargetReturnOrderItems").attachDisplay(jQuery.proxy(this.handleRouteMatched, this));
				this.onClear();
				// MessageManager handeler.
				var oMessageManager, oModel, oView;
				oView = this.getView();
				// set message model
				oMessageManager = sap.ui.getCore().getMessageManager();
				oView.setModel(oMessageManager.getMessageModel(), "message");
				// or just do it for the whole view
				oMessageManager.registerObject(oView, true);
				// create a default model with somde demo data
				oModel = new JSONModel({
					MandatoryInputValue: "",
					DateValue: null,
					IntegerValue: undefined,
					Dummy: ""
				});
				oModel.setDefaultBindingMode(BindingMode.TwoWay);
				oView.setModel(oModel);
			},
			handleRouteMatched: function (oEvent) {
				var oParams = {};
				var oTransfer = oEvent.getParameters().data;
				this.fnFilterTable(oTransfer.orderNo);
				var oResourceModel = new sap.ui.model.json.JSONModel();
				// let path = `/CustomerREturn('${oTransfer.orderNo}')`;
				//var path = "/CustomerREturn('${oTransfer.OrderNo}')";
				// var selectedOrder = this.getView().getModel().getProperty(path);
				oParams.OrderNo = oTransfer.orderNo;
				// 	oParams.SalesOrg = selectedOrder.SalesOrganization;
				oParams.SalesOrg = oTransfer.salesOrg;
				// // 	oParams.CustomerNo = selectedOrder.SoldToParty;
				oParams.CustomerNo = oTransfer.customerNumber;
				// // 	oParams.CustName = selectedOrder.CustomerName;
				oParams.CustName = oTransfer.customerName;
				// // 	oParams.DC = selectedOrder.DistributionChannel;
				oParams.DC = oTransfer.Channel;
				// // 	oParams.Division = selectedOrder.OrganizationDivision;
				oParams.Division = oTransfer.division;
				// // //	console.log("Order", selectedOrder);
				// // 	oParams.CreationDate = selectedOrder.CreationDate;
				var lvSplitvalue = oTransfer.creationDate.split("-");
				var lvYear = lvSplitvalue[0];
				var lvMonth = lvSplitvalue[1];
				var lvDay = lvSplitvalue[2];
				var lvSAPDateFormate = lvYear + "/" + lvMonth + "/" + lvDay;
				oParams.CreationDate = lvSAPDateFormate;
				// 	oParams.ResponseDate = selectedOrder.ResponseDate;
				// 	oParams.Status = selectedOrder.ApprovalStatusDesc;
				oResourceModel.setDefaultBindingMode("TwoWay");
				oResourceModel.setData(oParams);
				this.getView().setModel(oResourceModel, "OrderResource");
			},
			fnFilterTable: function (sFilter) {
				//Build filter array
				var oFilterValues = [];
				if (sFilter !== "") {
					oFilterValues.push(new Filter("CustomerReturn", FilterOperator.EQ, sFilter));
				}
				// console.log(sFilter);
				//Filter binding
				var oList = this.byId("idItemTable");
				var oBinding = oList.getBinding("items");
				oBinding.filter(oFilterValues);
			},
			_onFioriListReportTableUpdateFinished: function (oEvent) {
				var oTable = oEvent.getSource();
				var oHeaderbar = oTable.getAggregation("headerToolbar");
				if (oHeaderbar && oHeaderbar.getAggregation("content")[1]) {
					var oTitle = oHeaderbar.getAggregation("content")[1];
					if (oTable.getBinding("items") && oTable.getBinding("items").isLengthFinal()) {
						oTitle.setText("(" + oTable.getBinding("items").getLength() + ")");
					} else {
						oTitle.setText("(1)");
					}
				}
			},
			formatValudationSatus: function (sValue) {
				var statusIcon;
				if (sValue === "Rejected") {
					statusIcon = "sap-icon://status-error";
				} else if (sValue === "Waiting for approval" || sValue === "Partially Approved") {
					statusIcon = "sap-icon://status-critical";
				} else if (sValue === "Approved") {
					statusIcon = "sap-icon://status-completed";
				}
				return statusIcon;
			},
			formatAvailableToObjectState: function (bAvailable) {
				// return bAvailable ? "Error" : "Success";
				var vStatus;
				if (bAvailable === "Approved") {
					vStatus = "Success";
				} else if (bAvailable === "Waiting for approval") {
					vStatus = "Warning";
				} else if (bAvailable === "Rejected") {
					vStatus = "Error";
				} else if (bAvailable === "Partially Approved") {
					vStatus = "Warning";
				}
				return vStatus;
			},
			_onPageNavButtonPress: function (oEvent) {
				var oBindingContext;
				/*= oEvent.getSource().getBindingContext();*/
				this.onClear();
		 
				this.oView.setBusy(false);

				return new Promise(function (fnResolve) {
					this.doNavigate("RouteReturnOrders", oBindingContext, fnResolve, "");
				}.bind(this)).catch(function (err) {
					if (err !== undefined) {
						MessageBox.error(err.message);
					}
				});

			},
			doNavigate: function (sRouteName, oBindingContext, fnPromiseResolve, sViaRelation) {
				var sPath = oBindingContext ? oBindingContext.getPath() : null;
				var oModel = oBindingContext ? oBindingContext.getModel() : null;
				var sEntityNameSet;
				if (sPath !== null && sPath !== "") {
					if (sPath.substring(0, 1) === "/") {
						sPath = sPath.substring(1);
					}
					sEntityNameSet = sPath.split("(")[0];
				}
				var sNavigationPropertyName;
				var sMasterContext = this.sMasterContext ? this.sMasterContext : sPath;
				if (sEntityNameSet !== null) {
					sNavigationPropertyName = sViaRelation || this.getOwnerComponent().getNavigationPropertyForNavigationWithContext(sEntityNameSet,
						sRouteName);
				}
				if (sNavigationPropertyName !== null && sNavigationPropertyName !== undefined) {
					if (sNavigationPropertyName === "") {
						this.oRouter.navTo(sRouteName, {
							context: sPath,
							masterContext: sMasterContext
						}, false);
					} else {
						oModel.createBindingContext(sNavigationPropertyName, oBindingContext, null, function (bindingContext) {
							if (bindingContext) {
								sPath = bindingContext.getPath();
								if (sPath.substring(0, 1) === "/") {
									sPath = sPath.substring(1);
								}
							} else {
								sPath = "undefined";
							}
							// If the navigation is a 1-n, sPath would be "undefined" as this is not supported in Build
							if (sPath === "undefined") {
								this.oRouter.navTo(sRouteName);
							} else {
								this.oRouter.navTo(sRouteName, {
									context: sPath,
									masterContext: sMasterContext
								}, false);
							}
						}.bind(this));
					}
				} else {
					this.oRouter.navTo(sRouteName);
				}
				if (typeof fnPromiseResolve === "function") {
					fnPromiseResolve();
				}
			},
			fnApprovalReject: function (oEvent) {
				// var c4Text;
				var lvCustoermReturnItem;
				var lvApproval;
				var lvRejectReason;
				var lvCustoermReturnOrder = this.getView().getModel("OrderResource").oData.OrderNo;
				var returnOrderitems = this.byId("idItemTable").getItems();
				var larrayItems = [];
				var larrayUpdateParameter = [];
				var lcurrentDate = new Date().toISOString();
				lcurrentDate = lcurrentDate.slice(0, -1);
				// Set Busy Indicator
				//idItemTable
				this.oView.setBusy(true);

				// For each Record
				for (var i = 0; i < returnOrderitems.length; i++) {
					var item = returnOrderitems[i];
					lvCustoermReturnItem = item.getCells()[0].getText();
					/*Item*/
					lvApproval = item.getCells()[7].getSelectedIndex();
					/*Approval*/
					lvRejectReason = item.getCells()[8].getSelectedKey();
					/*Reject Reason*/
					// console.log("test");
					if (lvApproval == 0 && lvRejectReason == "") {
						larrayItems.push({
							// "CustomerReturnItem": lvCustoermReturnOrder,
							"CustomerReturnItem": lvCustoermReturnItem,
							"RetsMgmtProcessingBlock": ""
						});
						larrayUpdateParameter.push({
							"ZZ1_ResponseItemDate_SDI": lcurrentDate,
							"RetsMgmtProcessingBlock": ""
						});
					}
					/*iflvApproval === "0" && lvRejectReason === ""  */
					if (lvApproval === 0 && lvRejectReason !== "") {
						// MessageBox.error("Return Order  item " + lvCustoermReturnItem + " You approved Item with Reject Reason");
					}
					/*iflvApproval === "0" && lvRejectReason === ""  */
					if (lvApproval === 1 && lvRejectReason === "") {
						// MessageBox.error("Return Order  item " + lvCustoermReturnItem + " You Rejected Item without Reject Reason");
					}
					if (lvApproval === 1 && lvRejectReason !== "") {
						larrayItems.push({
							// "CustomerReturnItem": lvCustoermReturnOrder,

							"CustomerReturnItem": lvCustoermReturnItem,
							"SalesDocumentRjcnReason": lvRejectReason
						});
						larrayUpdateParameter.push({
							"ZZ1_ResponseItemDate_SDI": lcurrentDate,
							"SalesDocumentRjcnReason": lvRejectReason
						});
					} /*(lvApproval === "1" && lvRejectReason === "")  */
				}
				/* End For each Record */
				// build update odata funciton

				if (larrayItems.length === 0) {
					MessageBox.error("No items are filled");
				} else {
					var batchChanges = [];
					var sServiceUrl = "/sap/opu/odata/sap/API_CUSTOMER_RETURN_SRV/";
					var oModel = new sap.ui.model.odata.ODataModel(sServiceUrl, true);

					var saveSuccessfully;
					// Do loop to update Each Item
					for (i = 0; i < larrayItems.length; i++) {
						var lsPath = "/A_CustomerReturnItem" + "(CustomerReturn='" + lvCustoermReturnOrder + "',CustomerReturnItem='" + larrayItems[i].CustomerReturnItem +
							"')";
						// lsUpdateParamters = 
						// this.oModel.update(lsPath, /*Path*/
						// 	larrayUpdateParameter[i], /*UPdate parameter*/ {
						// 		refreshAfterChange: true,
						// 		success: function () {
						// 			// console.log("success", res);
						// 			this.fnSavesuccessful(); //saveSuccessfully = "successfully";
						// 		}.bind(this),
						// 		error: function () {
						// 			// console.log("failed", res);
						// 			// this.para_this();
						// 			// saveSuccessfully = "failed"; Nothing 
						// 		}.bind(this)
						// 	});

						batchChanges.push(oModel.createBatchOperation(lsPath, "MERGE", larrayUpdateParameter[i]));
						oModel.addBatchChangeOperations(batchChanges);
					} // Update finished if successfully then back to original overview page else keep current page
					// if (saveSuccessfully === "failed") {
					// 	para_this._onPageNavButtonPress(oEvent);
					// 	para_this.onClear();
					// 	saveSuccessfully = "";
					// } else {
					// 	para_this._onPageNavButtonPress(oEvent);
					// 	saveSuccessfully = "";
					// 	para_this.onClear();
					// }
					//submit changes and refresh the table and display message
					oModel.submitBatch(function (data) {
						oModel.refresh();
						// sap.ui.commons.MessageBox.show(data.__batchResponses[0].__changeResponses.length + " contacts created", 
						//      sap.ui.commons.MessageBox.Icon.SUCCESS,
						// 	"Batch Save", 
						// 	sap.ui.commons.MessageBox.Action.OK);
						if (data.__batchResponses[0].__changeResponses) {
							// alert("Inserted " + data.__batchResponses[0].__changeResponses.length + " Items");
							this.fnSavesuccessful(); //saveSuccessfully = "successfully";
						 
							this.oView.setBusy(false);
							
							console.log("Saved successfully!");
						} else {
							alert(data.__batchResponses[0].message);
						   	this.oView.setBusy(false);
						}

					}.bind(this), function (err) {
						alert("Error occurred ");
					}.bind(this));
				} /*if larrayItems.length === 0Eelse*/
			},
			fnSavesuccessful: function (oEvent) {
				// saveSuccessfully = "";
				MessageToast.show("Return Order Items have been submitted successfully!");
				this._onPageNavButtonPress();
				this.onClear();
			 
				this.oView.setBusy(false);
			},
			// fnSaveFail: function () {},
			funShowconfirmationMessage: function (oEvent) {
				MessageBox.warning("Are you sure to submit Items ?", {
					/*Message Box defination Started*/
					icon: MessageBox.Icon.WARNING,
					title: "Confirmation",
					actions: [
						MessageBox.Action.YES,
						MessageBox.Action.NO
					],
					emphasizedAction: MessageBox.Action.YES,
					initialFocus: MessageBox.Action.YES,
					onClose: function (sAction) {
						if (sAction === MessageBox.Action.YES) {
							this.fnApprovalReject(oEvent);
						} else {
							// MessageToast.show("Action selected: " + sAction);
						}
					}.bind(this)
				}); /*Message Box defination finished*/
				// if (userAction === "YES") {
				// 	return "YES";
				// 	MessageToast.show("Action selected: " + userAction);
				// } else if (userAction === "NO") {
				// 	return "NO";
				// 	MessageToast.show("Action selected: " + userAction);
				// }
				// else { return null}
			},
			fnCheck_value: function (oEvent) {
				var lvCustoermReturnItem;
				var lvApproval;
				var lvRejectReason;
				var returnOrderitems = this.byId("idItemTable").getItems();
				var conNotPassValue = "";
				var lstrMessage = "";
				for (var i = 0; i < returnOrderitems.length; i++) {
					var item = returnOrderitems[i];
					lvCustoermReturnItem = item.getCells()[0].getText();
					/*Item*/
					lvApproval = item.getCells()[7].getSelectedIndex();
					/*Approval*/
					lvRejectReason = item.getCells()[8].getSelectedKey();
					/*Reject Reason*/
					if (lvApproval === 1 && lvRejectReason === "") {
						lvRejectReason = item.getCells()[8];
						console.log("Value Check before submit error Reject reason is empty");
						// item.getCells()[8].setValueState(sap.ui.core.ValueState.Error);
						// item.getCells()[8].openValueStateMessage();
						// item.getCells()[8].setShowValueStateMessage();

						// MessageBox.error("Return Order  item " + lvCustoermReturnItem + " You Rejected Item without Reject Reason");
						lstrMessage = "Return Order  item " + lvCustoermReturnItem + " You Rejected Item without Reject Reason";
						this._fnAddMessagetoPopover(MessageType.Error, lstrMessage);
						// errorData.push({
						// 	// field: “Shift Worked_fnAddMessagetoPopover: function (ivMessageType, ivMessage) {”,

						// 	text: “Cannot be empty”,
						// 	type: “Error”,
						// 	icon: “sys - cancel - 2”
						// });
						conNotPassValue = "failed";
					} /*if (lvApproval === 1 && lvRejectReason == "" )*/
					else if (lvApproval === 0 && lvRejectReason !== "") {
						// MessageBox.error("Return Order  item " + lvCustoermReturnItem + " You approved Item with Reject Reason");
						// conNotPassValue = "failed";
						lstrMessage = "Return Order  item " + lvCustoermReturnItem + " You approved Item with Reject Reason";
						this._fnAddMessagetoPopover(MessageType.Error, lstrMessage);
						conNotPassValue = "failed";
					} else {
						// conNotPassValue = "";
					} /*if (lvApproval === 1 && lvRejectReason == "" )*/
				}
				/*For each record*/
				if (conNotPassValue === "") {
					return "Passed";
				} else {
					var btMessagePop = this.byId("btMessagePopover");
					btMessagePop.setVisible(true);
					var that = this;
					btMessagePop.addEventDelegate({
						"onAfterRendering": function () {
							that._getMessagePopover().openBy(btMessagePop);
						}
					}, this);
					// this.byId("btMessagePopover").setVisible(true);
					// this._getMessagePopover().openBy(this.byId("btMessagePopover"));
					return "Null";
				}
			},
			onSave: function (oEvent) {
				// console.log("test")
				// var c3Text;
				sap.ui.getCore().getMessageManager().removeAllMessages();
				// Before check clear all the massage.
				var checkPassed = this.fnCheck_value(oEvent);
				if (checkPassed === "Passed") {

					this.funShowconfirmationMessage(oEvent);
				}
			},
			onCancel: function () {
				this.funShowCancelMessage();
			},
			funShowCancelMessage: function (oEvent) {
				MessageBox.warning("Are you sure to cancel Items ?", {
					/*Message Box defination Started*/
					icon: MessageBox.Icon.WARNING,
					title: "Confirmation",
					actions: [
						MessageBox.Action.YES,
						MessageBox.Action.NO
					],
					emphasizedAction: MessageBox.Action.YES,
					initialFocus: MessageBox.Action.YES,
					onClose: function (sAction) {
						if (sAction === MessageBox.Action.YES) {
							this.onClear();
						} else {
							// MessageToast.show("Action selected: " + sAction);
						}
					}.bind(this)
				}); /*Message Box defination finished*/
			},
			onClear: function () {
				var returnOrderitems = this.byId("idItemTable").getItems();
				for (var i = 0; i < returnOrderitems.length; i++) {
					var item = returnOrderitems[i];
					var radioApproval = item.getCells()[7];
					/*Approval*/
					radioApproval.setSelectedIndex(0);
					var ojcombrjreason = item.getCells()[8];
					ojcombrjreason.setValueState(sap.ui.core.ValueState.None);
					ojcombrjreason.setValueStateText("");
					ojcombrjreason.setEnabled(false);
					ojcombrjreason.setSelectedItem(null);
				}

				// Clear the Message list
				sap.ui.getCore().getMessageManager().removeAllMessages();
				console.log("Clear User Choose"); // this.byId("ComboxRejReason").setSelectedKey("00");
			},
			/**
			 *@memberOf SAPUI5MyReturnOrder.CustomerReturnApproval.controller.ReturnOrderItems
			 */
			fnSelectedReject: function (oEvent) {
				// console.log(oEvent);
				if (oEvent.getParameter("selected")) {
					var ojcombrjreason = oEvent.getSource().getParent().getParent().getCells()[8];
					ojcombrjreason.setEnabled(true);
					// ojcombrjreason.setrequired(true);
					ojcombrjreason.setValueState(sap.ui.core.ValueState.Error);
					ojcombrjreason.setValueStateText("Please select reject reason");
					ojcombrjreason.setShowValueStateMessage(true); // oEvent.getSource().getParent().getParent().getCells()[8].setEnabled(true);
				} //This code was generated by the layout editor.
				sap.ui.getCore().getMessageManager().removeAllMessages();
			},

			/**
			 *
			 *@memberOf SAPUI5MyReturnOrder.CustomerReturnApproval.controller.ReturnOrderItems
			 */
			// ClearSelect: function (oEvent) {
			// 	//This code was generated by the layout editor.
			// 	var returnOrderitems = this.byId("idItemTable").getItems();
			// 	for (var i = 0; i < returnOrderitems.length; i++) {
			// 		var item = returnOrderitems[i];
			// 		var lvApproval = item.getCells()[7].getSelectedIndex();
			// 		/*Approval*/
			// 		item.getCells()[7].setSelectedIndex(0);
			// 		var lvRejectReason = item.getCells()[8].getSelectedKey();
			// 		item.getCells()[8].setEnabled(false);
			// 		item.getCells()[8].setSelectedItem(null);
			// 	}
			// 	console.log("test"); // this.byId("ComboxRejReason").setSelectedKey("00");
			// },
			/**
			 *@memberOf SAPUI5MyReturnOrder.CustomerReturnApproval.controller.ReturnOrderItems
			 */
			selectApproved: function (oEvent) {
				//This code was generated by the layout editor.
				if (oEvent.getParameter("selected")) {
					var ojcombrjreason = oEvent.getSource().getParent().getParent().getCells()[8];
					ojcombrjreason.setValueState(sap.ui.core.ValueState.None);
					ojcombrjreason.setValueStateText("");
					ojcombrjreason.setEnabled(false);
					// oEvent.getSource().getParent().getParent().getCells()[8].setEnabled(false);
					ojcombrjreason.setSelectedItem(null);
				} //This code was generated by the layout editor.

				sap.ui.getCore().getMessageManager().removeAllMessages();
			},
			/**
			 *@memberOf SAPUI5MyReturnOrder.CustomerReturnApproval.controller.ReturnOrderItems
			 */
			combRejectReasonChange: function (oEvent) {
				//This code was generated by the layout editor.
				if (oEvent.getParameters().itemPressed) {
					oEvent.getSource().setValueState(sap.ui.core.ValueState.None);
					oEvent.getSource().setValueStateText("");
				} else {
					oEvent.getSource().setValueState(sap.ui.core.ValueState.Error);
					oEvent.getSource().setValueStateText("Please select the reject reason");
				}
				console.log("user select the Combobox to choose the Reject reason");
				sap.ui.getCore().getMessageManager().removeAllMessages();
			},
			/**
			 *@memberOf SAPUI5MyReturnOrder.CustomerReturnApproval.controller.ReturnOrderItems
			 */

			_fnAddMessagetoPopover: function (ivMessageType, ivMessage) {
				var oMessage = new Message({
					message: ivMessage,
					type: ivMessageType,
					target: "/Dummy",
					processor: this.getView().getModel()
				});
				sap.ui.getCore().getMessageManager().addMessages(oMessage);

			},
			onMessagePopoverPress: function (oEvent) {
				this._getMessagePopover().openBy(oEvent.getSource());
			},
			_getMessagePopover: function () {
				// create popover lazily (singleton)
				if (!this._oMessagePopover) {
					this._oMessagePopover = sap.ui.xmlfragment(
						this.getView().getId(),
						"SAPUI5MyReturnOrder.CustomerReturnApproval.fragment.MessagePopover", this);
					this.getView().addDependent(this._oMessagePopover);
				}
				return this._oMessagePopover;
			}
		});
	}, /* bExport= */
	true);