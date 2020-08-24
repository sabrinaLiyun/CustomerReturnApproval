sap.ui.define(["sap/ui/core/mvc/Controller",
	"sap/m/MessageBox",
	"./utilities",
	"sap/ui/core/routing/History",
	"sap/ui/core/UIComponent",
	'sap/m/MessageToast',
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function (BaseController, MessageBox, Utilities, History, UIComponent, MessageToast, Filter, FilterOperator) {
	"use strict";

	return BaseController.extend("SAPUI5MyReturnOrder.CustomerReturnApproval.controller.ReturnOrders", {
		handleRouteMatched: function (oEvent) {
			var sAppId = "App1";

			var oParams = {};

			if (oEvent.mParameters.data.context) {
				this.sContext = oEvent.mParameters.data.context;

			} else {
				if (this.getOwnerComponent().getComponentData()) {
					var patternConvert = function (oParam) {
						if (Object.keys(oParam).length !== 0) {
							for (var prop in oParam) {
								if (prop !== "sourcePrototype" && prop.includes("Set")) {
									return prop + "(" + oParam[prop][0] + ")";
								}
							}
						}
					};

					this.sContext = patternConvert(this.getOwnerComponent().getComponentData().startupParameters);

				}
			}

			var oPath;

			if (this.sContext) {
				oPath = {
					path: "/" + this.sContext,
					parameters: oParams
				};
				this.getView().bindObject(oPath);
			}

			// this.refresh();
			// var oTable = this.byId("TabCustomerReturn");
			// var oBinding = oTable.getBinding("items");
			// var overView = this.getView().getModel("zreturn");
			// overView.refresh();
			this.onSearch();

		},
		_onFioriListReportTableItemPress: function (oEvent) {

			var oBindingContext = oEvent.getParameter("listItem").getBindingContext().getObject();

			/*return new Promise(function(fnResolve) {
				this.doNavigate("Page2", oBindingContext, fnResolve, "");
			}.bind(this)).catch(function(err) {
				if (err !== undefined) {
					MessageBox.error(err.message);
				}
			});*/
			// var salesArea = oBindingContext.SalesOrganization +  "/" +
			//                 oBindingContext.OrganizationDivision + "/" + 
			//                 oBindingContext.DistributionChannel ;
			var lvYear = oBindingContext.CreationDate.getFullYear();
			var lvMonth = oBindingContext.CreationDate.getMonth() + 1;
			var lvDay = oBindingContext.CreationDate.getUTCDate();
			var lvSAPDateFormate = lvYear + "-" + lvMonth + "-" + lvDay;

			var oRouter = UIComponent.getRouterFor(this);
			oRouter.navTo("RouteReturnOrderItems", {
				orderNo: oBindingContext.CustomerReturn,
				salesOrg: oBindingContext.SalesOrganization,
				Channel: oBindingContext.DistributionChannel,
				division: oBindingContext.OrganizationDivision,
				customerNumber: oBindingContext.SoldToParty,
				customerName: oBindingContext.CustomerName,
				creationDate: lvSAPDateFormate
			});

		},
		doNavigate: function (sRouteName, oBindingContext, fnPromiseResolve, sViaRelation) {
			var sPath = (oBindingContext) ? oBindingContext.getPath() : null;
			var oModel = (oBindingContext) ? oBindingContext.getModel() : null;

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
		_onFioriListReportActionButtonPress: function (oEvent) {

			var oBindingContext = oEvent.getSource().getBindingContext();

			return new Promise(function (fnResolve) {

				this.doNavigate("RouteCreateReturnOrder", oBindingContext, fnResolve, "");
			}.bind(this)).catch(function (err) {
				if (err !== undefined) {
					MessageBox.error(err.message);
				}
			});

		},
		onInit: function () {
			this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this.oRouter.getTarget("TargetReturnOrders").attachDisplay(jQuery.proxy(this.handleRouteMatched, this));
			this.oFilterBar = null;
			this.oFilterBar = this.getView().byId("ListReportFilterBar");
			// var oBasicSearch = new sap.m.SearchField({
			// 	showSearchButton: true
			// });
			// this.oFilterBar.setBasicSearch(oBasicSearch);
			// var aFilter = [];
			// var Appstakey = "00";
			// if (Appstakey) {
			// 	aFilter.push(new Filter("OverialApprovalSta", FilterOperator.Contains, Appstakey));
			// }
			// var oTable = this.byId("TabCustomerReturn");
			// var oBinding = oTable.getBinding("items");
			// oBinding.filter(aFilter);

		},
		onExit: function () {

			// to destroy templates for bound aggregations when templateShareable is true on exit to prevent duplicateId issue
			var aControls = [{
				"controlId": "Fiori_ListReport_ListReport_0-content-Fiori_ListReport_Table-1",
				"groups": ["items"]
			}];
			for (var i = 0; i < aControls.length; i++) {
				var oControl = this.getView().byId(aControls[i].controlId);
				if (oControl) {
					for (var j = 0; j < aControls[i].groups.length; j++) {
						var sAggregationName = aControls[i].groups[j];
						var oBindingInfo = oControl.getBindingInfo(sAggregationName);
						if (oBindingInfo) {
							var oTemplate = oBindingInfo.template;
							oTemplate.destroy();
						}
					}
				}
			}

		},
		onSearch: function (oEvent) {
			// var sMessage = "onSearch trigered";
			// MessageToast.show(sMessage);
			var i;

			// build filter array OveralApprovalStatus
			var aFilter = [];
			//var sQuery = oEvent.getParameter("query");
			// var keysAppSta = this.byId("comboApprovalSta").getSelectedKeys(); //["00", "01"]
			// for (i = 0; i <= keysAppSta.length; i++) {

			// }
			// }
			// Sales Org mulcomSalesOrg
			var keysSalesOrg = this.byId("mulcomSalesOrg").getSelectedKeys(); //["00", "01"]
			for (i = 0; i <= keysSalesOrg.length; i++) {
				var keysSalesOrg_key = keysSalesOrg[i];
				if (keysSalesOrg_key) {
					aFilter.push(new Filter("SalesOrganization", FilterOperator.Contains, keysSalesOrg_key));
				}
			}
			// Sales Number mulcomCustomer  Sold to Party.
			var keysCustomer = this.byId("mulcomCustomer").getSelectedKeys(); //["00", "01"]
			for (i = 0; i <= keysCustomer.length; i++) {
				var keysCustomer_key = keysCustomer[i];
				if (keysCustomer_key) {
					aFilter.push(new Filter("SoldToParty", FilterOperator.Contains, keysCustomer_key));
				}
			}
			// Creation Date as Filter
			var lvCreationDate = this.byId("datePCreateDatep")._getInputValue();

			if (lvCreationDate) {
				var lvYear = lvCreationDate.slice(0, 4);
				var lvMonth = lvCreationDate.slice(4, 6);
				var lvDay = lvCreationDate.slice(6, 8);
				var lvSAPDateFormate = lvYear + '-' + lvMonth + '-' + lvDay;
				aFilter.push(new Filter("CreationDate", FilterOperator.EQ, lvSAPDateFormate));
			}
			// Reponse Date as Filter

			// var lvResponseDate = this.byId("datePResponseDate")._getInputValue();

			// if (lvResponseDate) {
			// 	lvYear = lvResponseDate.slice(0, 4);
			// 	lvMonth = lvResponseDate.slice(4, 6);
			// 	lvDay = lvResponseDate.slice(6, 8);
			// 	lvSAPDateFormate = lvYear + '-' + lvMonth + '-' + lvDay;
			// 	aFilter.push(new Filter("ResponseDate", FilterOperator.EQ, lvSAPDateFormate));
			// }

			// aFilter.push(New Filter("CreationDate", FilterOperator.EQ ,))
			// for (i = 0; i < cars.length; i++) { 
			//                 text += cars[i] + "<br>"; }
			// if (sQuery) {	aFilter.push(new Filter("ApprovalStatus", FilterOperator.Contains, sQuery));
			// }

			// filter binding
			var oTable = this.byId("TabCustomerReturn");
			var oBinding = oTable.getBinding("items");
			oBinding.filter(aFilter);
		},

		onBasecSearch: function (oEvent) {
			var aFilter = [];
			var sQuery = oEvent.getParameter("query");
			if (sQuery) {
				aFilter.push(new Filter("CustomerReturn", FilterOperator.Contains, sQuery));
			}
			var oTable = this.byId("TabCustomerReturn");
			var oBinding = oTable.getBinding("items");
			oBinding.filter(aFilter);
		},
		onErrorbuttonPress: function (oEvent) {
			//Using this button to trigger the Batch$ postin
			this.oModel = this.getView().getModel("ZRETURN_SAP");
			var aDeferredGroup = this.oModel.getDeferredGroups().push("batchCreate");
			// this.oModel.setDeferredGroups(aDeferredGroup);
			// var mParameters = {					groupId: "batchCreate"				};
			// this.oModel.update("/A_CustomerReturn", oEntry1, mParameters);
			// 	var that =  this.oModel;

			var lsUpdatestr = {
				"ZZ1_ResponseDate_SDH": "2020-08-20T00:00:00"
			};
			var sServiceUrl = "/sap/opu/odata/sap/API_CUSTOMER_RETURN_SRV/";
			var oModel = new sap.ui.model.odata.ODataModel(sServiceUrl, true);
			// var status1 = {
			// 		StatusTxt: 'Okilidokli'
			// 	},
			// 	contactEntry1 = {
			// 		FirstName: 'Ned',
			// 		LastName: 'Flanders',
			// 		Email: '',
			// 		Contact_Status: [status1],
			// 	},
			// 	status2 = {
			// 		StatusTxt: 'Cuff em Lou'
			// 	},
			// 	contactEntry2 = {
			// 		FirstName: 'Chief',
			// 		LastName: 'Wiggum',
			// 		Email: '',
			// 		Contact_Status: [status2],
			// 	};
			//create an array of batch changes and save
			var batchChanges = [];
			batchChanges.push(oModel.createBatchOperation("A_CustomerReturn('60000243')", "MERGE",
				lsUpdatestr));

			// batchChanges.push(oModel.createBatchOperation("A_CustomerReturn('60000247')", "POST", lsUpdatestr));

			oModel.addBatchChangeOperations(batchChanges);
			//submit changes and refresh the table and display message
			oModel.submitBatch(function (data) {
				oModel.refresh();
				// sap.ui.commons.MessageBox.show(data.__batchResponses[0].__changeResponses.length + " contacts created", 
				//      sap.ui.commons.MessageBox.Icon.SUCCESS,
				// 	"Batch Save", 
				// 	sap.ui.commons.MessageBox.Action.OK);
				if (data.__batchResponses[0].__changeResponses) {
					alert("Inserted " + data.__batchResponses[0].__changeResponses.length + " Employee(s)");
				} else {
					alert(data.__batchResponses[0].message);
				}
				console.log("Saved successfully!");
			}, function (err) {
				alert("Error occurred ");
			});

		},
	});
}, /* bExport= */ true);