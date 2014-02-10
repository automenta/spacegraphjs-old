function MyDemoApplication(options) {
	// Apply super constructor
	DemoApplication.apply(this, arguments);
}

// Extend prototype methods
$.extend(MyDemoApplication.prototype, DemoApplication.prototype);

var joints = [];
var senses = [];


function getSenseVector() {
	var v = [];
	for (var i = 0; i < senses.length; i++) {
		var x = senses[i].values();
		for (var j = 0; j < x.length; j++)
			v.push(x[j]);
	}
	return v;
}

function newBodyOrientationSense(b) {
	return	{
		values : function() {
			var a = b.getOrientation().getAxis();	return [ a.x(), a.y(), a.z() ];
		}			
	};
}
function newBodyLinearVelocitySense(b) {
	return	{
		values : function() {
			var a = b.getLinearVelocity();	a.normalize(); return [ a.x(), a.y(), a.z() ];
		}			
	};
}
function newBodyAngularVelocitySense(b) {
	return	{
		values : function() {
			var a = b.getAngularVelocity();	return [ a.x(), a.y(), a.z() ];
		}			
	};
}
function newRetinaSense(sim, b, angle, px, py) {
	return	{
		values : function() {
			var fromDistance = 1.0;
			var distance = 10.0;

			var vector = b.getOrientation().getAxis();
			vector*=angle; //TODO make this use a pixel array within an angular focus

			var rayFrom = new btVector3(vector);
			rayFrom.op_mul(fromDistance);
			rayFrom.op_add(b.getCenterOfMassPosition());

			var rayTo = new btVector3(vector);
			rayTo.op_mul(distance);
			rayTo.op_add(b.getCenterOfMassPosition());

			var rayCallback = new Ammo.ClosestRayResultCallback(rayFrom,rayTo);
			sim.m_dynamicsWorld.rayTest(rayFrom,rayTo,rayCallback);

			var seenDistance = 0;
			if(rayCallback.hasHit()) {
			  var body = rayCallback.get_m_collisionObject();
			  if(body){
				// other exclusions?
				if(!(body.isStaticObject() || body.isKinematicObject())){
				  pickedBody = body = Ammo.btRigidBody.prototype.upcast(body);
				  
				  var pickPos = rayCallback.get_m_hitPointWorld();

				  seenDistance = (pickPos.distance(rayFrom) - fromDistance) / (distance-fromDistance);
				}
			}
			}


			return [ seenDistance ];
		}			
	};
}

function newLimb(sim, segments, origin, direction) {

	function newSegment(mass, size, location, color) {
		var boxShape1 = new Ammo.btBoxShape(size);
		boxShape1.color = color;

		var boxTrans1 = new Ammo.btTransform();
		boxTrans1.setIdentity();
		boxTrans1.setOrigin(location);
		var b = sim.localCreateRigidBody(mass, boxTrans1, boxShape1);
		b.setActivationState(4 /*Ammo.DISABLE_DEACTIVATION*/ );

		senses.push(newBodyOrientationSense(b));
		senses.push(newBodyLinearVelocitySense(b));
		senses.push(newBodyAngularVelocitySense(b));
		senses.push(newRetinaSense(sim, b, +1));
		senses.push(newRetinaSense(sim, b, -1));

		return b;

	}

	function attach(b1, b2, o1x, o2x) {
		// 1st constructor
		/*var hinge1 = new Ammo.btHingeConstraint(b1,
							  b2,
							  new Ammo.btVector3(-1,0,0),
							  new Ammo.btVector3(1,0,0)
							  );*/
		var bt1 = new Ammo.btTransform();
		bt1.setIdentity();
		bt1.setOrigin(new Ammo.btVector3(o1x, 0, 0));
		//bt1.setOrigin(new Ammo.btVector3(direction).op_mul(-0.5));

		var bt2 = new Ammo.btTransform();
		bt2.setIdentity();
		bt2.setOrigin(new Ammo.btVector3(o2x, 0, 0));
		//bt2.setOrigin(new Ammo.btVector3(direction).op_mul(0.5));

		var hinge1 = new Ammo.btGeneric6DofConstraint(b1, b2, bt1, bt2, true);
		hinge1.setAngularLowerLimit(new Ammo.btVector3(0, 0, 0));
		hinge1.setAngularUpperLimit(new Ammo.btVector3(0, 0.2, 0));

		joints.push(hinge1);
		sim.m_dynamicsWorld.addConstraint(hinge1, true);
	}

	var size = new Ammo.btVector3(0.3, 0.5, 0.2);
	var location = new Ammo.btVector3(origin[0], origin[1], origin[2]);
	var dx = 0.15; //spacing

	var lastSegment = null;
	for (var i = 0; i < segments; i++) {
		var s = newSegment(1, size, location, i % 2 == 0 ? 0x33ff33 : 0x6666ff);
		location.op_add(direction);
		if (lastSegment != null) {
			attach(lastSegment, s, -size.x() / 2.0 - dx, size.x() / 2.0 + dx);
		}
		size.op_mul(0.95); dx*=0.95;
		lastSegment = s;
	}


}


function newInsectron(sim, origin) {

	function newSegment(size, location, color) {
		var boxShape1 = new Ammo.btBoxShape(size);
		boxShape1.color = color;

		var boxTrans1 = new Ammo.btTransform();
		boxTrans1.setIdentity();
		boxTrans1.setOrigin(location);
		var b = sim.localCreateRigidBody(size.x() * size.y() * size.z(), boxTrans1, boxShape1);
		b.setActivationState(4 /*Ammo.DISABLE_DEACTIVATION*/ );
		return b;

	}

	function attach(b1, b2, o1x, o1y, o2x, o2y) {
		// 1st constructor
		/*var hinge1 = new Ammo.btHingeConstraint(b1,
							  b2,
							  new Ammo.btVector3(-1,0,0),
							  new Ammo.btVector3(1,0,0)
							  );*/
		var bt1 = new Ammo.btTransform();
		bt1.setIdentity();
		bt1.setOrigin(new Ammo.btVector3(o1x, o1y, 0));
		//bt1.setOrigin(new Ammo.btVector3(direction).op_mul(-0.5));

		var bt2 = new Ammo.btTransform();
		bt2.setIdentity();
		bt2.setOrigin(new Ammo.btVector3(o2x, o2y, 0));
		//bt2.setOrigin(new Ammo.btVector3(direction).op_mul(0.5));

		var hinge1 = new Ammo.btGeneric6DofConstraint(b1, b2, bt1, bt2, true);
		hinge1.setAngularLowerLimit(new Ammo.btVector3(0, -0.4, 0));
		hinge1.setAngularUpperLimit(new Ammo.btVector3(0, 0.4, 0));

		joints.push(hinge1);
		sim.m_dynamicsWorld.addConstraint(hinge1, true);
		return hinge1;
	}

	function attachFixed(b1, b2, o1x, o1y, o1z, o2x, o2y, o2z) {
		// 1st constructor
		/*var hinge1 = new Ammo.btHingeConstraint(b1,
							  b2,
							  new Ammo.btVector3(-1,0,0),
							  new Ammo.btVector3(1,0,0)
							  );*/
		var bt1 = new Ammo.btTransform();
		bt1.setIdentity();		bt1.setOrigin(new Ammo.btVector3(o1x, o1y, o1z));
		//bt1.setOrigin(new Ammo.btVector3(direction).op_mul(-0.5));

		var bt2 = new Ammo.btTransform();
		bt2.setIdentity(); 		bt2.setOrigin(new Ammo.btVector3(o2x, o2y, o2z));
		//bt2.setOrigin(new Ammo.btVector3(direction).op_mul(0.5));

		var hinge1 = new Ammo.btGeneric6DofConstraint(b1, b2, bt1, bt2, true);
		hinge1.setAngularLowerLimit(new Ammo.btVector3(0, 0, 0));
		hinge1.setAngularUpperLimit(new Ammo.btVector3(0, 0, 0));

		sim.m_dynamicsWorld.addConstraint(hinge1, true);
		return hinge1;
	}
	/*
	   f   h	
	 c b a d e
       g   i
	*/
	var center = new Ammo.btVector3(origin[0], origin[1], origin[2]);

	var a = newSegment(new Ammo.btVector3(0.6, 0.6, 0.2), center);
	var b = newSegment(new Ammo.btVector3(0.3, 0.4, 0.15), center);
	var d = newSegment(new Ammo.btVector3(0.3, 0.4, 0.15), center);

	attach(a, b, -0.5, 0, 0.5, 0);
	attach(a, d, 0.5, 0, -0.5, 0);

	var c = newSegment(new Ammo.btVector3(0.2, 0.2, 0.1), center);
	var e = newSegment(new Ammo.btVector3(0.2, 0.2, 0.1), center);

	attach(b, c, -0.3, 0, 0.3, 0);
	attach(d, e, 0.3, 0, -0.3, 0);

	var f = newSegment(new Ammo.btVector3(0.15, 0.4, 0.1), center);
	var g = newSegment(new Ammo.btVector3(0.15, 0.4, 0.1), center);

	var bf = attach(b, f, 0, -0.4, 0, 0.4);
	var bg = attach(b, g, 0, 0.4, 0, -0.4);
	{
		bf.setAngularUpperLimit(new Ammo.btVector3(0.4, 0.8, 0));
		bg.setAngularUpperLimit(new Ammo.btVector3(0.4, 0.8, 0));

	}

	{
		//buttons
		var b1 = newSegment(new Ammo.btVector3(0.2, 0.2, 0.05), center);	
		attachFixed(a, b1, -0.2, -0.2, -0.1, 0, 0, 0.1);

		var b2 = newSegment(new Ammo.btVector3(0.1, 0.15, 0.05), center);	
		attachFixed(a, b2, 0.2, 0.2, -0.1, 0, 0, 0.1);

	}

}


MyDemoApplication.prototype.initPhysics = function () {
	// Bullet-interfacing code
	var collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
	var dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
	var overlappingPairCache = new Ammo.btDbvtBroadphase();
	//var overlappingPairCache = new Ammo.btAxisSweep3(new Ammo.btVector3(-10,-10,-10),new Ammo.btVector3(10,10,10));

	var solver = new Ammo.btSequentialImpulseConstraintSolver();


	this.m_dynamicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
	this.m_dynamicsWorld.setGravity(this.tVec(0, -9.82, 0));


	/*
  // --- Create 2-box pendulum, using two hinge constraints ---
  // Create boxes
  var boxShape1 = new Ammo.btBoxShape(this.tVec(0.2, 1, 0.2));
  var boxTrans1 = new Ammo.btTransform();
  boxTrans1.setIdentity();
  boxTrans1.setOrigin(this.tVec(0, 1.0, 0));
  var box1 = this.localCreateRigidBody(1, boxTrans1, boxShape1);
  var boxShape2 = new Ammo.btBoxShape(this.tVec(0.2, 1, 0.2));
  var boxTrans2 = new Ammo.btTransform();
  boxTrans2.setIdentity();
  boxTrans2.setOrigin(this.tVec(1, 3.0, 0));
  var box2 = this.localCreateRigidBody(1, boxTrans2, boxShape2);
  // 1st constructor
  var hinge1 = new Ammo.btHingeConstraint(box1,
					  box2,
					  new Ammo.btVector3(0,1,0),
					  new Ammo.btVector3(0,-1,0),
					  new Ammo.btVector3(0,0,1),
					  new Ammo.btVector3(0,0,1),
					  false);
  // 2nd constructor
  var hinge2 = new Ammo.btHingeConstraint(box2,
					  new Ammo.btVector3(0,1,0),
					  new Ammo.btVector3(0,0,1),
					  false);
  this.m_dynamicsWorld.addConstraint(hinge1, true);
  this.m_dynamicsWorld.addConstraint(hinge2, true);
*/

	// Create infinite ground plane
	var aabbShape = new Ammo.btStaticPlaneShape(this.tVec(0, 1, 0), -1);
	var aabbTransform = new Ammo.btTransform();
	aabbTransform.setIdentity();
	this.localCreateRigidBody(0, aabbTransform, aabbShape);




	newLimb(this, 10, [2, 4, 2], new Ammo.btVector3(1, 0, 0));
	//newInsectron(this, [2,0,2]);


	// Reset scene
	this.clientResetScene();
	this.setCameraDistance(27);

	var that = this;
	that.running = true;
	setTimeout(function() {
		$('#RunningCheckbox').click(function() {
			console.log('Toggling Physics');
			that.running = !that.running;
		});
	}, 150);

};

var frame = 0;
var currentJoint = 0;

MyDemoApplication.prototype.clientMoveAndDisplay = function () {
	if (!this.running)
		return;

	// Simple dynamics world doesn't handle fixed-time-stepping
	var ms = this.getDeltaTimeMicroseconds();
	var minFPS = 1000000.0 / 60.0;
	if (ms > minFPS)
		ms = minFPS;

	if (this.m_dynamicsWorld)
		this.m_dynamicsWorld.stepSimulation(ms / 1000000.0);

	var a = Math.sin(frame / 50.0) * 3.14159 / 2.5;
	//  joints[0].setLimit(0, a-0.1, a+0.1);

	joints[currentJoint].setAngularLowerLimit(new Ammo.btVector3(0, a - 0.05, 0));
	joints[currentJoint].setAngularUpperLimit(new Ammo.btVector3(0, a + 0.05, 0));
	if (Math.random() < 0.05) {
		currentJoint = Math.floor( Math.random() * joints.length );
	}

	if ($('#DisplaySensesCheckbox').is(':checked')) {
		//display senses in a canvas
		var sg = $('#SenseGrid');
		sg.show();
		var c = document.getElementById("SenseGrid");
		var ctx = c.getContext("2d");


		ctx.fillStyle = "#000000";
		ctx.fillRect(0,0,c.width,c.height);

		var bx = 16, by = 10;
		var px = 0, py = 0;
		var s = getSenseVector();
		for (var j = 0; j < s.length; j++) {
			
			var i = 256.0 * Math.min(1.0, Math.max(0.0, Math.abs(s[j])));
			var R = 0, G = 0, B = 0;
			if (s[j] < 0)
				R = i;
			else
				B = i;

			R = Math.floor(R);
			G = Math.floor(G);
			B = Math.floor(B);
			ctx.fillStyle = 'rgba(' + R + ',' + G + ',' + B + ',1.0)';
			ctx.fillRect(px, py, bx, by);

			px += bx;
			if (px > c.width) {
				py += by;
				px = 0;
			}
	
		}
	}
	else {
		$('#SenseGrid').hide();
	}

	frame++;
};
