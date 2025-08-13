import * as assert from 'assert';
import { RubyParser } from '../../services/parsers/rubyParser';
import { createMockDocument, TestCodeSamples } from '../testUtils';

suite('Ruby Parser Test Suite', () => {
  let parser: RubyParser;

  setup(() => {
    parser = new RubyParser();
  });

  test('should identify Ruby files correctly', () => {
    const rubyDoc = createMockDocument('ruby');
    const tsDoc = createMockDocument('typescript');
    
    assert.strictEqual(parser.canParse(rubyDoc), true);
    assert.strictEqual(parser.canParse(tsDoc), false);
    assert.strictEqual(parser.getSupportedLanguage(), 'Ruby');
  });

  test('should extract functions from Ruby code', () => {
    const document = createMockDocument('ruby');
    const functions = parser.extractFunctions(document);
    
    assert.ok(functions.length >= 6, 'Should find at least 6 methods in Ruby sample');
    
    // Verify function names
    const functionNames = functions.map(f => f.name);
    assert.ok(functionNames.includes('initialize'), 'Should find initialize method');
    assert.ok(functionNames.includes('add'), 'Should find add method');
    assert.ok(functionNames.includes('multiply (class method)'), 'Should find class method');
    assert.ok(functionNames.includes('divide'), 'Should find divide method');
    assert.ok(functionNames.includes('process_numbers'), 'Should find method with blocks');
    assert.ok(functionNames.includes('valid? (predicate)'), 'Should find predicate method');
    assert.ok(functionNames.includes('fibonacci'), 'Should find standalone function');
  });

  test('should extract enhanced functions with complexity metrics', () => {
    const document = createMockDocument('ruby');
    const enhancedFunctions = parser.extractEnhancedFunctions(document);
    
    assert.ok(enhancedFunctions.length >= 6, 'Should find multiple methods with metrics');
    
    // Find the divide method
    const divideFunc = enhancedFunctions.find(f => f.name === 'divide');
    assert.ok(divideFunc, 'divide method should be found');
    assert.ok(divideFunc.cyclomaticComplexity >= 2, 'divide should have exception handling complexity');
    
    // Find the process_numbers method
    const processFunc = enhancedFunctions.find(f => f.name === 'process_numbers');
    assert.ok(processFunc, 'process_numbers method should be found');
    assert.ok(processFunc.cyclomaticComplexity >= 3, 'method with blocks should have reasonable complexity');
    
    // Find the fibonacci function
    const fibFunc = enhancedFunctions.find(f => f.name === 'fibonacci');
    assert.ok(fibFunc, 'fibonacci function should be found');
    assert.ok(fibFunc.cyclomaticComplexity >= 2, 'fibonacci should have conditional complexity');
  });

  test('should handle Ruby-specific syntax correctly', () => {
    const rubyCode = `
class UserService
  attr_accessor :users
  attr_reader :config
  attr_writer :logger
  
  def initialize(config = {})
    @config = config
    @users = []
  end
  
  def self.create_default
    new(default_config)
  end
  
  def add_user(user)
    return false unless valid_user?(user)
    @users << user
    true
  end
  
  def find_users(&block)
    @users.select(&block)
  end
  
  def process_users
    @users.each do |user|
      yield user if block_given?
    end
  end
  
  def user_names
    @users.map(&:name)
  end
  
  def active_users?
    @users.any?(&:active?)
  end
  
  def cleanup!
    @users.clear
    @config = nil
  end
  
  private
  
  def valid_user?(user)
    user.respond_to?(:name) && user.respond_to?(:email)
  end
  
  def self.default_config
    { timeout: 30, retries: 3 }
  end
end

module Helpers
  def format_name(name)
    name.strip.titleize
  end
  
  def safe_divide(a, b)
    return nil if b.zero?
    a.to_f / b
  end
end

def standalone_method(items)
  items.select { |item| item.valid? }
       .map { |item| item.process }
       .compact
end`;

    const document = createMockDocument('ruby');
    document.getText = () => rubyCode;
    
    const functions = parser.extractFunctions(document);
    const functionNames = functions.map(f => f.name);
    
    assert.ok(functionNames.includes('initialize'), 'Should detect initialize method');
    assert.ok(functionNames.includes('create_default (class method)'), 'Should detect class methods');
    assert.ok(functionNames.includes('add_user'), 'Should detect instance methods');
    assert.ok(functionNames.includes('find_users'), 'Should detect methods with blocks');
    assert.ok(functionNames.includes('process_users'), 'Should detect methods with yield');
    assert.ok(functionNames.includes('user_names'), 'Should detect methods with symbol to_proc');
    assert.ok(functionNames.includes('active_users? (predicate)'), 'Should detect predicate methods');
    assert.ok(functionNames.includes('cleanup! (mutating)'), 'Should detect mutating methods');
    assert.ok(functionNames.includes('valid_user? (predicate)'), 'Should detect private predicate methods');
    assert.ok(functionNames.includes('format_name'), 'Should detect module methods');
    assert.ok(functionNames.includes('safe_divide'), 'Should detect module methods');
    assert.ok(functionNames.includes('standalone_method'), 'Should detect standalone methods');
  });

  test('should provide appropriate confidence scores', () => {
    const rubyDocument = createMockDocument('ruby');
    rubyDocument.languageId = 'ruby';
    rubyDocument.fileName = '/test/file.rb';
    
    const tsDocument = createMockDocument('typescript');
    
    assert.ok(parser.getConfidence(rubyDocument) >= 0.9, 'Should have high confidence for Ruby files');
    assert.ok(parser.getConfidence(tsDocument) < 0.3, 'Should have low confidence for TypeScript files');
  });

  test('should handle Rails-specific patterns', () => {
    const railsCode = `
class ApplicationController < ActionController::Base
  before_action :authenticate_user!
  protect_from_forgery with: :exception
  
  private
  
  def authenticate_user!
    redirect_to login_path unless user_signed_in?
  end
end

class User < ApplicationRecord
  has_many :posts, dependent: :destroy
  validates :email, presence: true, uniqueness: true
  
  scope :active, -> { where(active: true) }
  scope :recent, ->(days = 7) { where('created_at > ?', days.days.ago) }
  
  def full_name
    "#{first_name} #{last_name}".strip
  end
  
  def self.find_by_credentials(email, password)
    user = find_by(email: email)
    return user if user&.authenticate(password)
    nil
  end
end

class PostsController < ApplicationController
  def index
    @posts = current_user.posts.includes(:comments)
    respond_to do |format|
      format.html
      format.json { render json: @posts }
    end
  end
  
  def create
    @post = current_user.posts.build(post_params)
    
    if @post.save
      redirect_to @post, notice: 'Post created successfully.'
    else
      render :new
    end
  end
  
  private
  
  def post_params
    params.require(:post).permit(:title, :content, :published)
  end
end`;

    const document = createMockDocument('ruby');
    document.getText = () => railsCode;
    
    const functions = parser.extractFunctions(document);
    const functionNames = functions.map(f => f.name);
    
    assert.ok(functionNames.includes('authenticate_user! (mutating)'), 'Should detect Rails controller methods');
    assert.ok(functionNames.includes('full_name'), 'Should detect model methods');
    assert.ok(functionNames.includes('find_by_credentials (class method)'), 'Should detect class finder methods');
    assert.ok(functionNames.includes('index'), 'Should detect controller actions');
    assert.ok(functionNames.includes('create'), 'Should detect controller actions');
    assert.ok(functionNames.includes('post_params'), 'Should detect private parameter methods');
  });

  test('should handle metaprogramming patterns', () => {
    const metaCode = `
class DynamicMethods
  ['get', 'post', 'put', 'delete'].each do |method|
    define_method("handle_#{method}") do |path, &block|
      routes[method.to_sym][path] = block
    end
  end
  
  def method_missing(method_name, *args, &block)
    if method_name.to_s.start_with?('find_by_')
      attribute = method_name.to_s.sub('find_by_', '')
      find_by_attribute(attribute, args.first)
    else
      super
    end
  end
  
  def respond_to_missing?(method_name, include_private = false)
    method_name.to_s.start_with?('find_by_') || super
  end
  
  def self.included(base)
    base.extend(ClassMethods)
  end
  
  module ClassMethods
    def acts_as_something
      define_method :something_method do
        "I act as something"
      end
    end
  end
end`;

    const document = createMockDocument('ruby');
    document.getText = () => metaCode;
    
    const functions = parser.extractFunctions(document);
    const functionNames = functions.map(f => f.name);
    
    assert.ok(functionNames.includes('method_missing'), 'Should detect method_missing');
    assert.ok(functionNames.includes('respond_to_missing? (predicate)'), 'Should detect respond_to_missing?');
    assert.ok(functionNames.includes('included (class method)'), 'Should detect hook methods');
    assert.ok(functionNames.includes('acts_as_something (class method)'), 'Should detect metaprogramming methods');
  });

  test('should handle edge cases gracefully', () => {
    // Empty file
    const emptyDoc = createMockDocument('ruby');
    emptyDoc.getText = () => '';
    const emptyFunctions = parser.extractFunctions(emptyDoc);
    assert.strictEqual(emptyFunctions.length, 0, 'Should handle empty files');

    // File with no methods
    const noMethodDoc = createMockDocument('ruby');
    noMethodDoc.getText = () => 'x = 1\ny = 2\nputs x + y';
    const noMethods = parser.extractFunctions(noMethodDoc);
    assert.strictEqual(noMethods.length, 0, 'Should handle files with no methods');

    // File with incomplete method (should not crash)
    const incompleteDoc = createMockDocument('ruby');
    incompleteDoc.getText = () => 'def incomplete_method\n  # missing end';
    assert.doesNotThrow(() => {
      parser.extractFunctions(incompleteDoc);
    }, 'Should handle incomplete syntax gracefully');
  });
});