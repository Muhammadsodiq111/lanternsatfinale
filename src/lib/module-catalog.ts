export type CatalogModule = { title: string; subtopics: string[] };
export type CatalogTopic = { title: string; modules: CatalogModule[] };

export const MODULE_CATALOG: Record<"math" | "english", CatalogTopic[]> = {
  math: [
    {
      title: "Algebra",
      modules: [
        {
          title: "Linear Equations in 1 Variable",
          subtopics: [
            "Isolating for One Variable",
            "Creating One Variable Equations",
            "Understanding One Variable Types",
            "Interpreting One Variable Equations",
          ],
        },
        {
          title: "Linear Equations in 2 Variables",
          subtopics: [
            "Slope and Intercepts",
            "Writing Equations of Lines",
            "Parallel and Perpendicular Lines",
            "Interpreting Linear Models",
            "Graphing Two Variable Equations",
          ],
        },
        {
          title: "Linear Functions",
          subtopics: [
            "Function Notation",
            "Rate of Change",
            "Building Linear Models",
            "Interpreting Function Values",
          ],
        },
        {
          title: "Linear Inequalities in 1 or 2 Variables",
          subtopics: [
            "Solving One Variable Inequalities",
            "Graphing Inequalities",
            "Systems of Inequalities",
          ],
        },
        {
          title: "Systems of 2 Linear Equations in 2 Variables",
          subtopics: [
            "Substitution",
            "Elimination",
            "Graphical Solutions",
            "No Solution and Infinite Solutions",
            "System Word Problems",
          ],
        },
      ],
    },
    {
      title: "Advanced Math",
      modules: [
        {
          title: "Equivalent Expressions",
          subtopics: [
            "Factoring",
            "Expanding and Simplifying",
            "Rational Expressions",
            "Exponent Rules",
          ],
        },
        {
          title: "Nonlinear Equations in 1/2 Variables",
          subtopics: [
            "Quadratic Formula",
            "Completing the Square",
            "Radical Equations",
            "Rational Equations",
            "Exponential Equations",
            "Systems with Nonlinear Equations",
          ],
        },
        {
          title: "Nonlinear Functions",
          subtopics: [
            "Parabola Features",
            "Transformations",
            "Polynomial Behavior",
            "Exponential Growth and Decay",
            "Interpreting Nonlinear Models",
          ],
        },
      ],
    },
    {
      title: "Problem-Solving and Data Analysis",
      modules: [
        {
          title: "Evaluating Statistical Claims",
          subtopics: ["Experimental Design", "Generalizing Results", "Causation vs. Correlation"],
        },
        {
          title: "Inferences from Sample Statistics",
          subtopics: ["Margin of Error", "Confidence Intervals", "Sampling Methods"],
        },
        {
          title: "1-Variable Data: Distributions & Measures",
          subtopics: ["Mean, Median, Mode", "Spread and Standard Deviation", "Reading Distributions"],
        },
        {
          title: "Percentages",
          subtopics: ["Percent Change", "Percent of a Total", "Successive Percentages", "Percent Word Problems"],
        },
        {
          title: "Probability & Conditional Probability",
          subtopics: ["Basic Probability", "Two-Way Tables", "Conditional Probability"],
        },
        {
          title: "Ratios, Rates, Proportional Relationships, and Units",
          subtopics: [
            "Ratios and Proportions",
            "Unit Rates",
            "Unit Conversions",
            "Scale and Similarity",
            "Mixed Rate Problems",
          ],
        },
        {
          title: "2-Variable Data: Models & Scatterplots",
          subtopics: ["Line of Best Fit", "Interpreting Scatterplots", "Exponential Models", "Predicting Values"],
        },
      ],
    },
    {
      title: "Geometry and Trigonometry",
      modules: [
        { title: "Area & Volume", subtopics: ["Area of Plane Figures", "Volume of Solids", "Surface Area"] },
        {
          title: "Circles",
          subtopics: ["Arc Length and Sectors", "Circle Equations", "Inscribed Angles", "Radians and Degrees"],
        },
        {
          title: "Lines, Angles, and Triangles",
          subtopics: ["Angle Relationships", "Triangle Properties", "Similar Triangles", "Congruence"],
        },
        {
          title: "Right Triangles & Trigonometry",
          subtopics: ["Pythagorean Theorem", "SOHCAHTOA", "Special Right Triangles"],
        },
      ],
    },
  ],
  english: [
    {
      title: "Standard English Conventions",
      modules: [
        {
          title: "Boundaries",
          subtopics: [
            "Periods and Semicolons",
            "Commas",
            "Colons and Dashes",
            "Run-Ons and Fragments",
            "Coordination and Subordination",
          ],
        },
        {
          title: "Form, Structure, and Sense",
          subtopics: [
            "Subject-Verb Agreement",
            "Verb Tense",
            "Pronoun Agreement",
            "Modifier Placement",
            "Parallel Structure",
            "Possessives and Plurals",
          ],
        },
      ],
    },
    {
      title: "Information and Ideas",
      modules: [
        {
          title: "Central Ideas & Details",
          subtopics: ["Main Idea", "Supporting Details", "Summarizing"],
        },
        {
          title: "Command of Evidence",
          subtopics: [
            "Textual Evidence",
            "Quantitative Evidence",
            "Graphs and Tables",
            "Claim Support",
            "Hypothesis Testing",
          ],
        },
        { title: "Inferences", subtopics: ["Logical Completion", "Implied Meaning", "Drawing Conclusions"] },
      ],
    },
    {
      title: "Craft and Structure",
      modules: [
        {
          title: "Cross-Text Connections",
          subtopics: ["Comparing Viewpoints", "Agreement and Disagreement", "Paired Passages", "Author Response"],
        },
        {
          title: "Text Structure & Purpose",
          subtopics: ["Purpose of a Sentence", "Overall Structure", "Rhetorical Function"],
        },
        { title: "Words in Context", subtopics: ["Vocabulary in Context", "Transitional Word Choice"] },
      ],
    },
    {
      title: "Expression of Ideas",
      modules: [
        {
          title: "Rhetorical Synthesis",
          subtopics: ["Goal-Based Synthesis", "Combining Notes", "Emphasis and Contrast", "Concise Presentation"],
        },
        {
          title: "Transitions",
          subtopics: ["Contrast Transitions", "Cause and Effect", "Continuation and Addition", "Illustration"],
        },
      ],
    },
  ],
};

export function topicsForSubject(subject: string): CatalogTopic[] {
  return MODULE_CATALOG[subject === "english" ? "english" : "math"];
}
