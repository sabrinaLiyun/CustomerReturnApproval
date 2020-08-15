sap.ui.define([
		"sap/ui/core/mvc/Controller",
		"sap/m/MessageBox",
		"./utilities",
		"sap/ui/core/routing/History",
		"sap/ui/model/Filter",
		"sap/ui/model/FilterOperator",
		"sap/m/MessageToast"
	], function (BaseController, MessageBox, Utilities, History, Filter, FilterOperator, MessageToast) {
		"use strict";
		return BaseController.extend("SAPUI5MyReturnOrder.MyReturnOrderAPP.controller.ReturnOrderItems", {
			onInit: function () {
				this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
				this.oRouter.getTarget("TargetReturnOrderItems").attachDisplay(jQuery.proxy(this.handleRouteMatched, this));
				this.onClear();
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
				var oBindingContext; /*= oEvent.getSource().getBindingContext();*/
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
							"RetsMgmtProcessingBlock": ""
						});
					}
					/*iflvApproval === "0" && lvRejectReason === ""  */
					if (lvApproval === 0 && lvRejectReason !== "") {
						MessageBox.error("Return Order  item " + lvCustoermReturnItem + " You approved Item with Reject Reason");
					}
					/*iflvApproval === "0" && lvRejectReason === ""  */
					if (lvApproval === 1 && lvRejectReason === "") {
						MessageBox.error("Return Order  item " + lvCustoermReturnItem + " You Rejected Item without Reject Reason");
					}
					if (lvApproval === 1 && lvRejectReason !== "") {
						larrayItems.push({
							// "CustomerReturnItem": lvCustoermReturnOrder,
							"CustomerReturnItem": lvCustoermReturnItem,
							"SalesDocumentRjcnReason": lvRejectReason
						});
						larrayUpdateParameter.push({
							"SalesDocumentRjcnReason": lvRejectReason
						});
					} /*(lvApproval === "1" && lvRejectReason === "")  */
				}
				/* End For each Record */
				// build update odata funciton
				if (larrayItems.length === 0) {
					MessageBox.error("No items are filled");
				} else {
					this.oModel = this.getView().getModel("ZRETURN_SAP");

					var saveSuccessfully;
					// Do loop to update Each Item
					for (i = 0; i < larrayItems.length; i++) {
						var lsPath = "/A_CustomerReturnItem" + "(CustomerReturn='" + lvCustoermReturnOrder + "',CustomerReturnItem='" +
							larrayItems[i].CustomerReturnItem +
							"')";
						// lsUpdateParamters = 
						this.oModel.update(lsPath, /*Path*/
							larrayUpdateParameter[i], /*UPdate parameter*/ {
								refreshAfterChange: true,
								success: function () {
									// console.log("success", res);

									this.fnSavesuccessful();
									//saveSuccessfully = "successfully";
								}.bind(this),
								error: function () {
									// console.log("failed", res);
									// this.para_this();
									// saveSuccessfully = "failed"; Nothing 
								}.bind(this)
							});
					}

					// Update finished if successfully then back to original overview page else keep current page

					// if (saveSuccessfully === "failed") {
					// 	para_this._onPageNavButtonPress(oEvent);
					// 	para_this.onClear();
					// 	saveSuccessfully = "";
					// } else {

					// 	para_this._onPageNavButtonPress(oEvent);
					// 	saveSuccessfully = "";
					// 	para_this.onClear();
					// }

				} /*if larrayItems.length === 0Eelse*/

			},
			fnSavesuccessful: function (oEvent) {

				// saveSuccessfully = "";
				MessageToast.show("Return Order Items have been submitted successfully!");
				this._onPageNavButtonPress();
				this.onClear();

			},
			// fnSaveFail: function () {},
			funShowconfirmationMessage: function (oEvent) {

				MessageBox.warning("Are you sure to submit Items ?", { /*Message Box defination Started*/
					icon: MessageBox.Icon.WARNING,
					title: "Confirmation",
					actions: [MessageBox.Action.YES, MessageBox.Action.NO],
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
			fnCheck_value: function () {
				var lvCustoermReturnItem;
				var lvApproval;
				var lvRejectReason;
				var returnOrderitems = this.byId("idItemTable").getItems();
				var conNotPassValue = "";

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
						MessageBox.error("Return Order  item " + lvCustoermReturnItem + " You Rejected Item without Reject Reason");
						// errorData.push({
						// 	// field: “Shift Worked”,
						// 	text: “Cannot be empty”,
						// 	type: “Error”,
						// 	icon: “sys - cancel - 2”
						// });
						conNotPassValue = "failed";

					} /*if (lvApproval === 1 && lvRejectReason == "" )*/
					else if (lvApproval === 0 && lvRejectReason !== "") {
						MessageBox.error("Return Order  item " + lvCustoermReturnItem + " You approved Item with Reject Reason");
						conNotPassValue = "failed";
					} else {
						// conNotPassValue = "";
					} /*if (lvApproval === 1 && lvRejectReason == "" )*/

				} /*For each record*/

				if (conNotPassValue === "") {
					return "Passed";
				} else {
					return "Null";
				}

			},

			onSave: function (oEvent) {
				// console.log("test")
				// var c3Text;
				var checkPassed = this.fnCheck_value();
				if (checkPassed === "Passed") {
					this.funShowconfirmationMessage(oEvent);
				}

			},
			onCancel: function () {
				this.funShowCancelMessage();

			},

			funShowCancelMessage: function (oEvent) {

				MessageBox.warning("Are you sure to cancel Items ?", { /*Message Box defination Started*/
					icon: MessageBox.Icon.WARNING,
					title: "Confirmation",
					actions: [MessageBox.Action.YES, MessageBox.Action.NO],
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
				console.log("Clear User Choose"); // this.byId("ComboxRejReason").setSelectedKey("00");
			},
			/**
			 *@memberOf SAPUI5MyReturnOrder.MyReturnOrderAPP.controller.ReturnOrderItems
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
			},
			/**
			 *@memberOf SAPUI5MyReturnOrder.MyReturnOrderAPP.controller.ReturnOrderItems
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
			 *@memberOf SAPUI5MyReturnOrder.MyReturnOrderAPP.controller.ReturnOrderItems
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
			},
			/**
			 *@memberOf SAPUI5MyReturnOrder.MyReturnOrderAPP.controller.ReturnOrderItems
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
			}
		});
	}, /* bExport= */
	true);