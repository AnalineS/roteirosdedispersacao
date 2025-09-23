/**
 * @name Input Sanitization for Medical Platform
 * @description Detects unsanitized user input that could affect medical calculations
 * @kind path-problem
 * @problem.severity error
 * @security-severity 8.0
 * @precision high
 * @id medical-platform/input-sanitization
 * @tags security
 *       medical
 *       sanitization
 *       user-input
 */

import python
import semmle.python.dataflow.DataFlow
import semmle.python.dataflow.TaintTracking

/**
 * Sources: User input that could contain medical data
 */
class MedicalUserInputSource extends DataFlow::Node {
  MedicalUserInputSource() {
    // Flask request data
    exists(Attribute attr |
      attr.getObject().(Name).getId() = "request" and
      (
        attr.getName() = "json" or
        attr.getName() = "form" or
        attr.getName() = "args" or
        attr.getName() = "data"
      ) and
      this.asCfgNode() = attr
    )
    or
    // Direct function parameters that might be user input
    exists(Function func, Parameter param |
      (
        func.getName().matches("%chat%") or
        func.getName().matches("%dose%") or
        func.getName().matches("%calculate%") or
        func.getName().matches("%validate%")
      ) and
      param = func.getArg(_) and
      this.asCfgNode() = param
    )
  }
}

/**
 * Sinks: Medical processing functions that should receive sanitized input
 */
class MedicalProcessingSink extends DataFlow::Node {
  MedicalProcessingSink() {
    // Mathematical operations on medical data
    exists(BinOp op |
      (op.getOp() instanceof Mult or op.getOp() instanceof Div) and
      this.asCfgNode() = op.getLeft()
    )
    or
    // Database queries with medical data
    exists(CallNode call |
      call.getFunction().getName().matches("%execute%") and
      this.asCfgNode() = call.getAnArg()
    )
    or
    // AI/ML model inputs
    exists(CallNode call |
      (
        call.getFunction().getName().matches("%openai%") or
        call.getFunction().getName().matches("%generate%") or
        call.getFunction().getName().matches("%completion%")
      ) and
      this.asCfgNode() = call.getAnArg()
    )
  }
}

/**
 * Sanitization barriers: Functions that clean input
 */
class SanitizationBarrier extends DataFlow::Node {
  SanitizationBarrier() {
    // Bleach sanitization
    exists(CallNode call |
      call.getFunction().getName() = "clean" and
      call.getFunction().(Attribute).getObject().(Name).getId() = "bleach" and
      this.asCfgNode() = call
    )
    or
    // HTML escape
    exists(CallNode call |
      call.getFunction().getName() = "escape" and
      this.asCfgNode() = call
    )
    or
    // Custom validation functions
    exists(CallNode call |
      (
        call.getFunction().getName().matches("%sanitiz%") or
        call.getFunction().getName().matches("%validat%") or
        call.getFunction().getName() = "validate_and_sanitize_input"
      ) and
      this.asCfgNode() = call
    )
  }
}

/**
 * Taint tracking configuration
 */
class MedicalInputSanitizationConfig extends TaintTracking::Configuration {
  MedicalInputSanitizationConfig() {
    this = "MedicalInputSanitization"
  }

  override predicate isSource(DataFlow::Node source) {
    source instanceof MedicalUserInputSource
  }

  override predicate isSink(DataFlow::Node sink) {
    sink instanceof MedicalProcessingSink
  }

  override predicate isSanitizer(DataFlow::Node node) {
    node instanceof SanitizationBarrier
  }
}

/**
 * Main query
 */
from MedicalInputSanitizationConfig config, DataFlow::PathNode source, DataFlow::PathNode sink
where config.hasFlowPath(source, sink)
select sink.getNode(), source, sink,
  "Unsanitized user input reaches medical processing function. This could affect medical calculations or expose the system to injection attacks."