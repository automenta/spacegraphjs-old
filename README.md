# CritterJS

Virtual life & robotics simulation environment for Javascript/WebGL

Uses Ammo.JS and Three.JS to create an interactive simulation that can serve as embodiment for AI and cognitive software components.

Ammo.JS is a Javascript port of the Bullet3D rigid-body kinematics physics engine.

## Senses
* Proprioception: orientation, linear velocity, angular velocity
* Vision: in-world ray tracing
* (more coming soon)

## Motors
* Rotation joint
* (more coming soon)

## Agents
* Agents can be developed to generate motor signals from observed sense signals.
* Agents may be implemented in Javascript (and ideally run in a web-worker thread) or integrated remotely via websockets or HTTP connection.
