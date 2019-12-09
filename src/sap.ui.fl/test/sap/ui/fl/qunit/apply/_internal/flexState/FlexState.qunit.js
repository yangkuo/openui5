/* global QUnit */

sap.ui.define([
	"sap/ui/fl/apply/_internal/flexState/FlexState",
	"sap/ui/fl/apply/_internal/flexState/Loader",
	"sap/ui/thirdparty/sinon-4"
], function (
	FlexState,
	Loader,
	sinon
) {
	"use strict";

	var sandbox = sinon.sandbox.create();
	var sReference = "sap.ui.fl.reference";

	function _mockPrepareFunctions(sMapName) {
		var oReturn = {};
		if (sMapName === "appDescriptorMap") {
			oReturn.appDescriptorChanges = sMapName;
		} else if (sMapName === "changesMap") {
			oReturn.changes = sMapName;
		} else if (sMapName === "variantsMap") {
			oReturn.variantsMap = sMapName;
		}
		return oReturn;
	}

	QUnit.module("FlexState with loadFlexData and _callPrepareFunction stubbed", {
		beforeEach: function () {
			this.oLoadFlexDataStub = sandbox.stub(Loader, "loadFlexData").resolves();
			this.oCallPrepareFunctionStub = sandbox.stub(FlexState, "_callPrepareFunction").callsFake(_mockPrepareFunctions);
		},
		afterEach: function () {
			FlexState.clearState();
			sandbox.restore();
		}
	}, function () {
		QUnit.test("when initForReference is called with complete information", function (assert) {
			return FlexState.initForReference({
				component: {},
				reference: sReference,
				componentId: "componentId"
			}).then(function(oReturn) {
				assert.equal(oReturn, undefined, "the function resolves without value");
				assert.equal(this.oLoadFlexDataStub.callCount, 1, "the FlexState made a call to load the flex data");
				assert.equal(this.oCallPrepareFunctionStub.callCount, 0, "no prepare function was called");
			}.bind(this));
		});

		QUnit.test("when initForReference is called without a reference", function(assert) {
			assert.throws(
				function() {FlexState.initForReference({storageResponse: "FlexResponse"});},
				"the init function throws an error"
			);
		});

		QUnit.test("when initForReference is called twice with the same reference with waiting", function(assert) {
			return FlexState.initForReference({
				reference: sReference,
				component: {}
			})
			.then(FlexState.initForReference.bind(null, {
				reference: sReference,
				component: {}
			}))
			.then(function() {
				assert.equal(this.oLoadFlexDataStub.callCount, 1, "the data is only requested once");
			}.bind(this));
		});

		QUnit.test("when initForReference is called twice with the same reference with waiting", function(assert) {
			FlexState.initForReference({
				reference: sReference,
				component: {}
			});
			return FlexState.initForReference({
				reference: sReference,
				component: {}
			}).then(function() {
				assert.equal(this.oLoadFlexDataStub.callCount, 1, "the data is only requested once");
			}.bind(this));
		});

		QUnit.test("when getUIChanges / getAppDescriptorChanges / getVariantsState is called without initialization", function(assert) {
			return FlexState.initForReference({
				reference: "sap.ui.fl.other.reference",
				component: {}
			})
			.then(function() {
				assert.equal(this.oCallPrepareFunctionStub.callCount, 0, "no prepare function was called");
				assert.throws(
					function() {FlexState.getUIChanges(sReference);},
					"the getUIChanges function throws an error"
				);
				assert.throws(
					function() {FlexState.getAppDescriptorChanges(sReference);},
					"the getAppDescriptorChanges function throws an error"
				);
				assert.throws(
					function() {FlexState.getVariantsState(sReference);},
					"the getVariantsState function throws an error"
				);
			}.bind(this));
		});

		QUnit.test("when getAppDescriptorChanges / getUIChanges / getVariantsState is called with proper initialization", function(assert) {
			return FlexState.initForReference({
				reference: sReference,
				component: {}
			})
			.then(function() {
				assert.equal(FlexState.getAppDescriptorChanges(sReference), "appDescriptorMap", "the correct map is returned");
				assert.equal(this.oCallPrepareFunctionStub.callCount, 1, "the prepare function was called twice");
				assert.equal(FlexState.getAppDescriptorChanges(sReference), "appDescriptorMap", "the correct map is returned");
				assert.equal(this.oCallPrepareFunctionStub.callCount, 1, "the prepare function was not called again");

				assert.equal(FlexState.getUIChanges(sReference), "changesMap", "the correct map is returned");
				assert.equal(this.oCallPrepareFunctionStub.callCount, 2, "the prepare function was called once");
				assert.equal(FlexState.getUIChanges(sReference), "changesMap", "the correct map is returned");
				assert.equal(this.oCallPrepareFunctionStub.callCount, 2, "the prepare function was not called again");

				assert.deepEqual(FlexState.getVariantsState(sReference), {variantsMap: "variantsMap"}, "the correct map is returned");
				assert.equal(this.oCallPrepareFunctionStub.callCount, 3, "the prepare function was called once");
				assert.deepEqual(FlexState.getVariantsState(sReference), {variantsMap: "variantsMap"}, "the correct map is returned");
				assert.equal(this.oCallPrepareFunctionStub.callCount, 3, "the prepare function was not called again");
			}.bind(this));
		});

		QUnit.test("when clearState is called with and without reference", function(assert) {
			var sReference2 = "second.reference";
			var sReference3 = "third.reference";
			return FlexState.initForReference({
				reference: sReference,
				component: {}
			})
			.then(FlexState.initForReference.bind(null, {
				reference: sReference2,
				component: {}
			}))
			.then(function() {
				assert.ok(FlexState.getUIChanges(sReference), "before clearState state1 is available");
				assert.ok(FlexState.getUIChanges(sReference2), "before clearState state2 is available");
				FlexState.clearState(sReference);
				assert.throws(
					function() {FlexState.getUIChanges({reference: sReference});},
					"after clearState(1) there is no state1 anymore"
				);
				assert.ok(FlexState.getUIChanges(sReference2), "after clearState(1) state2 is still there");
			})
			.then(FlexState.initForReference.bind(null, {
				reference: sReference3,
				component: {}
			}))
			.then(function() {
				assert.ok(FlexState.getUIChanges(sReference2), "before clearState state2 is available");
				assert.ok(FlexState.getUIChanges(sReference3), "before clearState state3 is available");
				FlexState.clearState();
				assert.throws(
					function() {FlexState.getUIChanges({reference: sReference});},
					"after clearState() there is no state2 anymore"
				);
				assert.throws(
					function() {FlexState.getUIChanges({reference: sReference});},
					"after clearState() there is no state3 anymore"
				);
			});
		});
	});

	QUnit.done(function () {
		jQuery("#qunit-fixture").hide();
	});
});
